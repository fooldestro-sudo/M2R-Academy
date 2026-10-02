// <!-- OAW Academy — UI prototype with NO real security. Credentials live in plain text, enrollment is a localStorage flag, and the OTP is the shown code reversed. Do NOT use for real, private, or paid content. -->
/* OAW Academy — UI prototype with NO real security.
   Credentials live in a plain-text JSON file, enrollment is a localStorage
   boolean, and the OTP is trivially derivable (reverse of the shown code).
   Do NOT use this pattern for real, private, or paid content. When real
   protection is needed, credential checks and video gating must move
   behind a server.
*/
(function () {
  'use strict';

  /* ============================== Utils ============================== */

  /**
   * Query a single element.
   * @param {string} sel CSS selector
   * @param {ParentNode} [root=document]
   * @returns {Element|null}
   */
  function $(sel, root) { return (root || document).querySelector(sel); }

  /**
   * Query all elements as an array.
   * @param {string} sel CSS selector
   * @param {ParentNode} [root=document]
   * @returns {Element[]}
   */
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /**
   * Escape a string for safe innerHTML interpolation.
   * @param {string} s
   * @returns {string}
   */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format seconds as m:ss.
   * @param {number} sec
   * @returns {string}
   */
  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  /** Show a toast message that auto-dismisses. */
  var toastTimer = null;
  function toast(message, type) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast toast--visible' + (type ? ' toast--' + type : '');
    el.hidden = false;
    // Force reflow so re-triggered toasts animate correctly.
    void el.offsetWidth;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('toast--visible');
      el.hidden = true;
    }, 3000);
  }

  function showFieldError(el, message) {
    if (!el) return;
    if (!message) { el.textContent = ''; el.hidden = true; return; }
    el.textContent = message;
    el.hidden = false;
  }

  function shakeElement(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // restart animation
    el.classList.add('shake');
    setTimeout(function () { el.classList.remove('shake'); }, 450);
  }

  /* ====================== State & storage keys ======================= */

  var LS_SESSION = 'eduportal.session';
  var LS_ENROLLED = 'eduportal.enrolled';
  var LS_PROGRESS = 'eduportal.progress';
  var LS_QUALITY = 'eduportal.quality'; // device preference, not per-user

  function loadQualityPref() {
    var q = readLS(LS_QUALITY, 'hd720');
    if (q === 'auto' || q === 'hd720' || q === 'large' || q === 'medium') state.qualityMode = q;
    var sel = $('#quality');
    if (sel) sel.value = state.qualityMode;
  }

  function saveQualityPref() {
    writeLS(LS_QUALITY, state.qualityMode);
  }

  // Per-user namespacing: every account keeps its own enrollments + progress
  // under `eduportal.enrolled.<username>` / `eduportal.progress.<username>`,
  // so two users on the same device never see each other's data.
  function scopeSuffix() {
    return state.currentUser && state.currentUser.username
      ? '.' + String(state.currentUser.username).toLowerCase()
      : '';
  }

  function enrolledKey() { return LS_ENROLLED + scopeSuffix(); }
  function progressKey() { return LS_PROGRESS + scopeSuffix(); }

  /**
   * One-time upgrade: move pre-existing global enrollments/progress
   * (from before per-user storage) onto the current user, then drop the
   * shared keys so accounts stay isolated from here on.
   */
  function migrateLegacyUserData() {
    if (!state.currentUser) return;
    try {
      var uk = enrolledKey();
      var pk = progressKey();
      if (window.localStorage.getItem(uk) === null && window.localStorage.getItem(LS_ENROLLED) !== null) {
        window.localStorage.setItem(uk, window.localStorage.getItem(LS_ENROLLED));
      }
      if (window.localStorage.getItem(pk) === null && window.localStorage.getItem(LS_PROGRESS) !== null) {
        window.localStorage.setItem(pk, window.localStorage.getItem(LS_PROGRESS));
      }
      window.localStorage.removeItem(LS_ENROLLED);
      window.localStorage.removeItem(LS_PROGRESS);
    } catch (e) { /* storage unavailable — nothing to migrate */ }
  }

  var state = {
    users: [],
    courses: [],
    currentUser: null,      // { username, displayName }
    currentCourseId: null,
    currentVideoIndex: 0,
    enrollCourseId: null,
    enrollCode: null,
    player: null,           // YT.Player instance
    playerReady: false,
    tickTimer: null,
    storageOK: true,
    currentTrackId: null,
    detailMode: 'course',
    enrollTrackPrefix: null,
    qualityMode: 'hd720' // hd720 | large (480p) | medium (360p) | auto
  };

  // Player-local flags (kept outside persisted state on purpose).
  var isSeeking = false;
  var isVerifying = false;
  var lastProgressSave = 0;
  var ytApiPromise = null;
  var failCount = 0;

  function readLS(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeLS(key, value) {
    if (!state.storageOK) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeLS(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function detectStorage() {
    try {
      var k = '__eduportal_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      state.storageOK = true;
    } catch (e) {
      state.storageOK = false;
      var note = $('#storage-notice');
      if (note) note.hidden = false;
    }
  }

  function getEnrolled() {
    var list = readLS(enrolledKey(), []);
    return Array.isArray(list) ? list.filter(function (x) { return typeof x === 'string'; }) : [];
  }

  function isEnrolled(courseId) {
    return getEnrolled().indexOf(courseId) !== -1;
  }

  function addEnrollment(courseId) {
    var list = getEnrolled();
    if (list.indexOf(courseId) === -1) list.push(courseId);
    writeLS(enrolledKey(), list);
  }

  function getCurrentCourse() {
    if (!state.currentCourseId) return null;
    return getCourseById(state.currentCourseId);
  }

  function getCourseById(courseId) {
    for (var i = 0; i < state.courses.length; i++) {
      if (state.courses[i].id === courseId) return state.courses[i];
    }
    return null;
  }

  /* ============================== Tracks ============================= */
  // Six learning tracks. Programming and Trading each bundle two courses
  // (two choices); the rest hold a single course. The first letter of every
  // enrollment code is the track prefix so the Appline can tell tracks apart.
  var TRACKS = [
    { id: 'programming', prefix: 'P', icon: '💻', title: 'البرمجة',
      tagline: 'اختر: C++ للتأسيس أو Python للسوق', courseIds: ['programming-cpp', 'programming-python'] },
    { id: 'web', prefix: 'W', icon: '🌐', title: 'تطوير الويب',
      tagline: 'HTML • CSS • JavaScript • TypeScript • React', courseIds: ['web-dev'] },
    { id: 'chess', prefix: 'C', icon: '♞', title: 'الشطرنج',
      tagline: 'من الصفر للاحتراف — Takkat Chess', courseIds: ['chess'] },
    { id: 'trading', prefix: 'T', icon: '📈', title: 'التداول',
      tagline: 'الدورة الكلاسيكية — Part 1 و Part 1.1', courseIds: ['trading-part1', 'trading-part1-1'] }
  ];

  function getTrackById(trackId) {
    for (var i = 0; i < TRACKS.length; i++) {
      if (TRACKS[i].id === trackId) return TRACKS[i];
    }
    return null;
  }

  function trackCourses(track) {
    var out = [];
    (track.courseIds || []).forEach(function (cid) {
      var c = getCourseById(cid);
      if (c) out.push(c);
    });
    return out;
  }

  function trackVideoCount(track) {
    var n = 0;
    trackCourses(track).forEach(function (c) { n += (c.videos || []).length; });
    return n;
  }

  function trackTimeText(track) {
    var cs = trackCourses(track);
    if (cs.length === 1) return cs[0].totalTime || '—';
    return cs.length + ' parts';
  }

  function trackEnrolled(track) {
    var enrolled = getEnrolled();
    var cs = trackCourses(track);
    for (var i = 0; i < cs.length; i++) {
      if (enrolled.indexOf(cs[i].id) !== -1) return true;
    }
    return false;
  }

  function trackProgress(track) {
    var cs = trackCourses(track);
    var pct = 0;
    cs.forEach(function (c) { pct = Math.max(pct, courseProgress(c)); });
    return pct;
  }

  /* ============================= Bootstrap =========================== */

  function parseInlineJson(id) {
    try {
      var node = document.getElementById(id);
      if (!node) return null;
      var text = node.textContent || '';
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /**
   * Load users + courses. Try fetch() first (works over http),
   * fall back to inline <script type="application/json"> (works on file://).
   */
  function loadData() {
    var usersP = fetchJson('data/users.json').catch(function () { return fetchJson('./data/users.json'); }).catch(function () { return null; });
    var coursesP = fetchJson('data/courses.json').catch(function () { return fetchJson('./data/courses.json'); }).catch(function () { return null; });
    return Promise.all([usersP, coursesP]).then(function (pair) {
      var usersData = pair[0] || parseInlineJson('users-data');
      var coursesData = pair[1] || parseInlineJson('courses-data');
      if (usersData && Array.isArray(usersData.users)) state.users = usersData.users;
      if (coursesData && Array.isArray(coursesData.courses)) state.courses = coursesData.courses;
      if (!state.users.length) {
        var inlineU = parseInlineJson('users-data');
        if (inlineU && Array.isArray(inlineU.users)) state.users = inlineU.users;
      }
      if (!state.courses.length && !(coursesData && Array.isArray(coursesData.courses))) {
        var inlineC = parseInlineJson('courses-data');
        if (inlineC && Array.isArray(inlineC.courses)) state.courses = inlineC.courses;
      }
    });
  }

  function init() {
    detectStorage();
    bindAuth();
    bindCourseNav();
    bindEnroll();
    bindControls();
    bindGlobalKeys();
    window.addEventListener('beforeunload', function () { saveProgress(true); });

    var retryBtn = $('#btn-retry-courses');
    if (retryBtn) retryBtn.addEventListener('click', function () { boot(true); });

    boot(false);
  }

  function boot(isRetry) {
    loadData().then(function () {
      if (!state.users.length || !state.courses.length) {
        // Partial failure: surface which side failed.
        var errBox = $('#courses-load-error');
        if (errBox && (!state.courses.length)) {
          // Only show the courses error box; login can still work with inline users.
          errBox.hidden = false;
        }
        if (!state.users.length) {
          showFieldError($('#login-error'), 'Could not load users. Please reload the page.');
        }
      }
      restoreSession();
    });
  }

  /* ============================== Router ============================= */

  var SCREENS = ['screen-login', 'screen-courses', 'screen-detail', 'screen-enroll', 'screen-player'];

  /**
   * Show exactly one screen; hide the rest, manage topbar + focus,
   * and stop the player tick when leaving the player.
   * @param {string} id one of SCREENS
   */
  function showScreen(id) {
    if (SCREENS.indexOf(id) === -1) id = 'screen-login';
    if (id !== 'screen-player') stopTick();
    SCREENS.forEach(function (sid) {
      var sec = document.getElementById(sid);
      if (!sec) return;
      var on = sid === id;
      sec.classList.toggle('active', on);
      if (on) sec.removeAttribute('hidden'); else sec.setAttribute('hidden', '');
    });
    var topbar = $('#topbar');
    var loggedIn = !!state.currentUser;
    var onLogin = id === 'screen-login';
    if (topbar) topbar.hidden = !(loggedIn && !onLogin);
    // Move focus to the new screen's heading for screen-reader users.
    var active = document.getElementById(id);
    if (active) {
      var h = active.querySelector('h1');
      if (h) {
        if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
        try { h.focus({ preventScroll: true }); } catch (e) { try { h.focus(); } catch (_e) {} }
      }
    }
  }

  /* =============================== Auth ============================== */

  function bindAuth() {
    var form = $('#login-form');
    if (form) form.addEventListener('submit', function (ev) { ev.preventDefault(); handleLogin(); });
    var logoutBtn = $('#btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  }

  function findUser(username, password) {
    var needle = String(username).toLowerCase();
    for (var i = 0; i < state.users.length; i++) {
      var u = state.users[i];
      if (!u || typeof u.username !== 'string') continue;
      if (String(u.username).toLowerCase() === needle && u.password === password) return u;
    }
    return null;
  }

  function handleLogin() {
    var userInput = $('#login-username');
    var passInput = $('#login-password');
    var errEl = $('#login-error');
    var rawUser = userInput ? userInput.value : '';
    var rawPass = passInput ? passInput.value : '';
    var username = rawUser.trim(); // trim username only; password is exact

    if (!username || !rawPass) {
      showFieldError(errEl, 'Please fill in both fields.');
      shakeElement($('#login-card'));
      return;
    }
    var match = findUser(username, rawPass);
    if (!match) {
      showFieldError(errEl, 'Invalid username or password.');
      shakeElement($('#login-card'));
      if (passInput) { passInput.value = ''; try { passInput.focus(); } catch (e) {} }
      return;
    }
    var displayName = match.displayName || match.username;
    state.currentUser = { username: match.username, displayName: displayName };
    writeLS(LS_SESSION, { username: match.username, displayName: displayName });
    migrateLegacyUserData();
    showFieldError(errEl, null);
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    var chip = $('#user-chip');
    if (chip) chip.textContent = displayName;
    renderCourses();
    showScreen('screen-courses');
  }

  function logout() {
    saveProgress(true); // still signed in here, so it lands on this user's key
    state.currentUser = null;
    removeLS(LS_SESSION);
    showScreen('screen-login');
    var u = $('#login-username');
    try { if (u) u.focus(); } catch (e) {}
  }

  function restoreSession() {
    var sess = readLS(LS_SESSION, null);
    if (sess && typeof sess.username === 'string') {
      var found = null;
      var needle = sess.username.toLowerCase();
      for (var i = 0; i < state.users.length; i++) {
        var u = state.users[i];
        if (u && String(u.username).toLowerCase() === needle) { found = u; break; }
      }
      if (!found) {
        // Stale session: user no longer exists -> force logout.
        removeLS(LS_SESSION);
        state.currentUser = null;
        showScreen('screen-login');
        return;
      }
      state.currentUser = { username: found.username, displayName: found.displayName || found.username };
      migrateLegacyUserData();
      var chip = $('#user-chip');
      if (chip) chip.textContent = state.currentUser.displayName;
      renderCourses();
      showScreen('screen-courses');
    } else {
      state.currentUser = null;
      showScreen('screen-login');
    }
  }

  /* ============================== Render ============================= */

  function thumbFallback(img) {
    img.onerror = null;
    img.classList.add('img-fallback');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  function courseProgress(course) {
    var all = readLS(progressKey(), {});
    if (!all || !all[course.id]) return 0;
    var total = (course.videos || []).length;
    if (!total) return 0;
    var idx = all[course.id].videoIndex || 0;
    return Math.min(100, Math.round((idx / total) * 100));
  }

  function renderCourses() {
    var grid = $('#courses-grid');
    var empty = $('#courses-empty');
    var loadErr = $('#courses-load-error');
    if (!grid) return;
    grid.innerHTML = '';
    var enrolled = getEnrolled();

    if (!state.courses.length) {
      if (empty) empty.hidden = false;
      var sub = $('#courses-sub');
      if (sub) sub.textContent = 'No tracks available right now.';
      return;
    }
    if (empty) empty.hidden = true;
    if (loadErr) loadErr.hidden = true;
    var sub2 = $('#courses-sub');
    if (sub2) sub2.textContent = 'Choose your track — 4 professional Arabic tracks.';

    TRACKS.forEach(function (track) {
      var cs = trackCourses(track);
      if (!cs.length) return; // catalogue still loading this track
      var first = cs[0];
      var count = trackVideoCount(track);
      var enrolledHere = trackEnrolled(track);
      var card = document.createElement('article');
      card.className = 'course-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View track: ' + track.title);

      var pct = trackProgress(track);
      var progressHtml = pct > 0
        ? '<div class="course-card__progress" aria-hidden="true"><div class="course-card__progress-bar" style="width:' + pct + '%"></div></div>'
        : '';

      card.innerHTML =
        '<div class="course-card__thumb-wrap">' +
          '<img class="course-card__thumb" loading="lazy" alt="' + escapeHtml(track.title) + ' thumbnail" />' +
          '<span class="course-card__track-icon" aria-hidden="true">' + track.icon + '</span>' +
          (enrolledHere ? '<span class="course-card__badge">✓ Enrolled</span>' : '') +
        '</div>' +
        '<div class="course-card__body">' +
          '<h3 class="course-card__title" dir="auto">' + escapeHtml(track.title) + '</h3>' +
          '<p class="course-card__tagline" dir="auto">' + escapeHtml(track.tagline) + '</p>' +
          '<div class="course-card__meta">' +
            '<span class="chip">⏱ ' + escapeHtml(trackTimeText(track)) + '</span>' +
            '<span class="chip">🎬 ' + count + ' video' + (count === 1 ? '' : 's') + '</span>' +
          '</div>' +
          '<p class="course-card__about" dir="auto">' + escapeHtml(first.about || '') + '</p>' +
          progressHtml +
          '<span class="course-card__cta">View track →</span>' +
        '</div>';

      var img = card.querySelector('img');
      img.addEventListener('error', function () { thumbFallback(img); });
      img.src = first.thumbnail || '';
      if (!first.thumbnail) thumbFallback(img);

      card.addEventListener('click', function () { openTrack(track.id); });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openTrack(track.id); }
      });
      grid.appendChild(card);
    });
  }

  /* ============================ Course nav =========================== */

  function bindCourseNav() {
    var back = $('#btn-back-courses');
    if (back) back.addEventListener('click', function () {
      var track = getTrackById(state.currentTrackId);
      if (track && (track.courseIds || []).length > 1 && state.detailMode === 'course') {
        renderTrackParts(state.currentTrackId);
        showScreen('screen-detail');
      } else {
        renderCourses();
        showScreen('screen-courses');
      }
    });
    var backP = $('#btn-back-player');
    if (backP) backP.addEventListener('click', function () {
      saveProgress(true);
      if (state.currentCourseId) { renderDetail(state.currentCourseId); showScreen('screen-detail'); }
      else showScreen('screen-courses');
    });
    var detailAction = $('#btn-detail-action');
    if (detailAction) detailAction.addEventListener('click', function () {
      if (!state.currentCourseId) return;
      if (isEnrolled(state.currentCourseId)) openPlayer(state.currentCourseId);
      else startEnroll(state.currentCourseId);
    });
  }

  /**
   * Open a course detail screen. Guards against unknown ids
   * (e.g. stale enrollments, rapid clicks).
   * @param {string} courseId
   */
  function openCourse(courseId) {
    var course = getCourseById(courseId);
    if (!course || course.comingSoon) return;
    state.currentCourseId = courseId;
    if (course.track) state.currentTrackId = course.track;
    state.detailMode = 'course';
    renderDetail(courseId);
    showScreen('screen-detail');
  }

  /**
   * Open a track. Single-course tracks go straight to the course detail;
   * multi-choice tracks (Programming, Trading) first show the parts list.
   * @param {string} trackId
   */
  function openTrack(trackId) {
    var track = getTrackById(trackId);
    if (!track) return;
    var cs = trackCourses(track);
    if (!cs.length) return;
    state.currentTrackId = trackId;
    if (cs.length === 1) {
      state.currentCourseId = cs[0].id;
      state.detailMode = 'course';
      renderDetail(cs[0].id);
    } else {
      state.detailMode = 'parts';
      renderTrackParts(trackId);
    }
    showScreen('screen-detail');
  }

  function renderDetail(courseId) {
    var course = null;
    for (var i = 0; i < state.courses.length; i++) {
      if (state.courses[i].id === courseId) { course = state.courses[i]; break; }
    }
    if (!course) return;
    var videos = Array.isArray(course.videos) ? course.videos : [];
    var enrolledHere = isEnrolled(courseId);

    var thumb = $('#detail-thumb');
    if (thumb) {
      thumb.onerror = function () { thumbFallback(thumb); };
      thumb.src = course.thumbnail || '';
      thumb.alt = course.title + ' thumbnail';
      if (!course.thumbnail) thumbFallback(thumb);
    }
    var title = $('#detail-title');
    if (title) title.textContent = course.title;
    var about = $('#detail-about');
    if (about) about.textContent = course.about || course.description || '';
    var chips = $('#detail-chips');
    if (chips) {
      chips.innerHTML =
        '<span class="chip">⏱ ' + escapeHtml(course.totalTime || '—') + '</span>' +
        '<span class="chip">🎬 ' + videos.length + ' video' + (videos.length === 1 ? '' : 's') + '</span>' +
        (course.comingSoon
          ? '<span class="chip chip--warning">🕒 Coming soon</span>'
          : (enrolledHere
            ? '<span class="chip chip--success">✓ Enrolled</span>'
            : '<span class="chip chip--warning">🔒 Locked</span>'));
    }
    var action = $('#btn-detail-action');
    if (action) {
      action.style.display = '';
      if (course.comingSoon) { action.textContent = 'Coming soon'; action.disabled = true; }
      else { action.disabled = false; action.textContent = enrolledHere ? '▶ Continue course' : 'Enroll this course'; }
    }
    var backBtn = $('#btn-back-courses');
    if (backBtn) {
      var tr = getTrackById(state.currentTrackId);
      backBtn.textContent = (tr && (tr.courseIds || []).length > 1) ? '← Back to track' : '← All tracks';
    }

    var list = $('#detail-videos');
    if (list) {
      list.innerHTML = '';
      var lastSection = null;
      videos.forEach(function (v, idx) {
        if (v.section && v.section !== lastSection) {
          lastSection = v.section;
          var sh = document.createElement('li');
          sh.className = 'video-list__section';
          sh.textContent = v.section;
          list.appendChild(sh);
        }
        var li = document.createElement('li');
        if (enrolledHere) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'video-list__item';
          btn.innerHTML =
            '<span class="video-list__index">' + (idx + 1) + '.</span>' +
            '<span class="video-list__title">' + escapeHtml(v.title) + '</span>' +
            (v.duration ? '<span class="video-list__duration">' + escapeHtml(v.duration) + '</span>' : '');
          btn.addEventListener('click', function () { openPlayer(courseId, idx); });
          li.appendChild(btn);
        } else {
          var row = document.createElement('div');
          row.className = 'video-list__item video-list__item--locked';
          row.setAttribute('aria-disabled', 'true');
          row.innerHTML =
            '<span class="video-list__index">' + (idx + 1) + '.</span>' +
            '<span class="video-list__title">' + escapeHtml(v.title) + '</span>' +
            (v.duration ? '<span class="video-list__duration">' + escapeHtml(v.duration) + '</span>' : '') +
            '<span class="video-list__lock" aria-label="Locked" title="Enroll to unlock">🔒</span>';
          li.appendChild(row);
        }
        list.appendChild(li);
      });
    }
    var vtitle = $('#detail-videos-title');
    if (vtitle) vtitle.textContent = course.comingSoon ? 'Course content' : 'Course videos';
  }

  /**
   * Render the parts list of a multi-choice track
   * (Programming: C++ / Python — Trading: Part 1 / Part 1.1).
   * @param {string} trackId
   */
  function renderTrackParts(trackId) {
    var track = getTrackById(trackId);
    if (!track) return;
    var cs = trackCourses(track);
    var thumb = $('#detail-thumb');
    if (thumb) {
      thumb.onerror = function () { thumbFallback(thumb); };
      thumb.src = (cs[0] && cs[0].thumbnail) || '';
      thumb.alt = track.title + ' thumbnail';
    }
    var title = $('#detail-title');
    if (title) title.textContent = track.icon + ' ' + track.title;
    var about = $('#detail-about');
    if (about) about.textContent = track.tagline;
    var chips = $('#detail-chips');
    if (chips) {
      chips.innerHTML = '<span class="chip">🧩 ' + cs.length + ' parts</span>' +
        '<span class="chip">🎬 ' + trackVideoCount(track) + ' videos</span>';
    }
    var action = $('#btn-detail-action');
    if (action) action.style.display = 'none';
    var backBtn = $('#btn-back-courses');
    if (backBtn) backBtn.textContent = '← All tracks';
    var vtitle = $('#detail-videos-title');
    if (vtitle) vtitle.textContent = 'Choose your part';
    var list = $('#detail-videos');
    if (list) {
      list.innerHTML = '';
      cs.forEach(function (c) {
        var n = (c.videos || []).length;
        var enrolledHere = isEnrolled(c.id);
        var li = document.createElement('li');
        var card = document.createElement('div');
        card.className = 'part-card';
        var btnLabel = c.comingSoon ? 'Coming soon' : (enrolledHere ? '▶ Continue' : 'Enroll now');
        card.innerHTML =
          '<div class="part-card__info">' +
            '<strong class="part-card__title" dir="auto">' + escapeHtml(c.title) + '</strong>' +
            '<span class="part-card__meta">🎬 ' + n + ' video' + (n === 1 ? '' : 's') +
            ' · ⏱ ' + escapeHtml(c.totalTime || '—') + '</span>' +
          '</div>';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ' + (enrolledHere ? 'btn-ghost' : 'btn-primary') + ' btn-sm';
        btn.textContent = btnLabel;
        if (c.comingSoon) btn.disabled = true;
        else {
          (function (cid, en) {
            btn.addEventListener('click', function () {
              if (en) openPlayer(cid);
              else startEnroll(cid);
            });
          })(c.id, enrolledHere);
        }
        card.appendChild(btn);
        li.appendChild(card);
        list.appendChild(li);
      });
    }
  }

  /* ============================== Enroll ============================= */

  /**
   * Generates a per-track 8-character hexadecimal enrollment code.
   * The first character is the fixed track prefix (C/P/E/S/T/W) so the
   * Appline knows which track the user is enrolling in; the remaining
   * 7 characters are random hex digits.
   * @param {string} prefix track letter, e.g. "T"
   * @returns {string} e.g. "T3F9A1C4"
   */
  function generateCode(prefix) {
    var p = String(prefix || 'X').toUpperCase().charAt(0);
    var hex = '0123456789ABCDEF';
    var code = p;
    for (var i = 1; i < 8; i++) {
      code += hex.charAt(Math.floor(Math.random() * 16));
    }
    return code;
  }

  /**
   * The OTP the user must type: the code, reversed.
   * "T3F9A1C4" -> "4C1A9F3T" (case-insensitive).
   * @param {string} code
   * @returns {string}
   */
  function expectedOtp(code) {
    return String(code).split('').reverse().join('');
  }

  function bindEnroll() {
    var back = $('#btn-back-detail');
    if (back) back.addEventListener('click', function () {
      if (state.currentCourseId) { renderDetail(state.currentCourseId); showScreen('screen-detail'); }
      else showScreen('screen-courses');
    });
    var copy = $('#btn-copy');
    if (copy) copy.addEventListener('click', copyCode);
    var regen = $('#btn-regen');
    if (regen) regen.addEventListener('click', function () {
      state.enrollCode = generateCode(state.enrollTrackPrefix);
      failCount = 0;
      var codeEl = $('#enroll-code');
      if (codeEl) codeEl.textContent = state.enrollCode;
      var otp = $('#otp-input');
      if (otp) otp.value = '';
      showFieldError($('#otp-error'), null);
    });
    var verify = $('#btn-verify');
    if (verify) verify.addEventListener('click', verifyOtp);
    var otpInput = $('#otp-input');
    if (otpInput) otpInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); verifyOtp(); }
    });
  }

  /**
   * Begin the enroll flow for a course: fresh code, clean input.
   * @param {string} courseId
   */
  function startEnroll(courseId) {
    state.currentCourseId = courseId;
    state.enrollCourseId = courseId;
    var _c = getCourseById(courseId);
    state.enrollTrackPrefix = (_c && _c.trackPrefix) || 'X';
    state.enrollCode = generateCode(state.enrollTrackPrefix);
    failCount = 0;
    var course = getCurrentCourse();
    var nameEl = $('#enroll-course-name');
    if (nameEl) nameEl.textContent = course ? course.title : courseId;
    var hint = $('#enroll-track-hint');
    if (hint) hint.textContent = 'Track code — starts with \u201c' + state.enrollTrackPrefix + '\u201d.';
    var codeEl = $('#enroll-code');
    if (codeEl) codeEl.textContent = state.enrollCode;
    var otp = $('#otp-input');
    if (otp) otp.value = '';
    showFieldError($('#otp-error'), null);
    showScreen('screen-enroll');
  }

  function copyCode() {
    var btn = $('#btn-copy');
    var code = state.enrollCode || '';
    function done() {
      if (!btn) return;
      var original = 'Copy';
      btn.textContent = '✓ Copied';
      setTimeout(function () { btn.textContent = original; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, function () { legacyCopy(code, done); });
    } else {
      legacyCopy(code, done);
    }
  }

  function legacyCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) { /* clipboard unavailable; user can select manually */ }
  }

  function verifyOtp() {
    if (isVerifying) return; // debounce double-clicks
    isVerifying = true;
    var btn = $('#btn-verify');
    if (btn) btn.disabled = true;
    try {
      var otpInput = $('#otp-input');
      var errEl = $('#otp-error');
      var raw = otpInput ? otpInput.value : '';
      var digits = String(raw).replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
      if (digits.length < 8) {
        showFieldError(errEl, 'Please enter the 8-character code.');
        shakeElement(otpInput);
        return;
      }
      var expected = expectedOtp(state.enrollCode || '').toUpperCase();
      if (digits !== expected) {
        failCount++;
        showFieldError(errEl, 'Incorrect OTP. Please try again.');
        shakeElement(otpInput);
        if (otpInput) { otpInput.value = ''; try { otpInput.focus(); } catch (e) {} }
        // Optional hardening: fresh code after 3 failures.
        if (failCount >= 3) {
          state.enrollCode = generateCode(state.enrollTrackPrefix);
          failCount = 0;
          var codeEl = $('#enroll-code');
          if (codeEl) codeEl.textContent = state.enrollCode;
        }
        return;
      }
      showFieldError(errEl, null);
      var target = state.enrollCourseId || state.currentCourseId;
      if (target) {
        addEnrollment(target);
        state.currentCourseId = target;
      }
      renderCourses();
      toast('Course unlocked!', 'success');
      setTimeout(function () {
        if (state.currentCourseId) openPlayer(state.currentCourseId);
        else showScreen('screen-courses');
      }, 600);
    } finally {
      isVerifying = false;
      if (btn) btn.disabled = false;
    }
  }

  /* ============================== Player ============================= */

  /**
   * Load the YouTube IFrame API lazily, exactly once.
   * @returns {Promise<void>}
   */
  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (!settled && !(window.YT && window.YT.Player)) {
          settled = true;
          showPlayerFallback('The YouTube player could not be loaded. Check your connection.');
          reject(new Error('YouTube API timeout'));
        }
      }, 10000);
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') { try { prev(); } catch (e) {} }
        if (!settled) { settled = true; clearTimeout(timer); resolve(); }
      };
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = function () {
        if (!settled) { settled = true; clearTimeout(timer); showPlayerFallback('The YouTube player could not be loaded. Check your connection.'); reject(new Error('YouTube API blocked')); }
      };
      document.head.appendChild(tag);
    });
    return ytApiPromise;
  }

  function showPlayerFallback(message) {
    var fb = $('#player-fallback');
    var txt = $('#player-fallback-text');
    var err = $('#player-error');
    if (txt && message) txt.textContent = message;
    if (fb) fb.hidden = false;
    if (err && message) { err.textContent = message; err.hidden = false; }
  }

  function hidePlayerFallback() {
    var fb = $('#player-fallback');
    if (fb) fb.hidden = true;
    var err = $('#player-error');
    if (err) { err.textContent = ''; err.hidden = true; }
  }

  /**
   * Open the player for a course, optionally at a given video index.
   * Restores saved progress when no explicit index is given.
   * @param {string} courseId
   * @param {number} [videoIndex]
   */
  function openPlayer(courseId, videoIndex) {
    state.currentCourseId = courseId;
    var course = getCurrentCourse();
    if (!course || !course.videos || !course.videos.length) return;
    var saved = loadProgress(courseId);
    var idx = typeof videoIndex === 'number' ? videoIndex : (saved ? saved.videoIndex : 0);
    if (idx < 0) idx = 0;
    if (idx >= course.videos.length) idx = 0;
    state.currentVideoIndex = idx;
    state.pendingSeek = saved && typeof videoIndex !== 'number' ? saved.seconds : 0;
    showScreen('screen-player');
    renderNowPlaying();
    renderPlaylist();
    hidePlayerFallback();
    loadYouTubeApi().then(function () { ensurePlayer(); }, function () { /* fallback already shown */ });
  }

  function ensurePlayerContainer() {
    var wrap = $('#player-wrapper');
    if (!wrap) return null;
    var holder = $('#yt-player');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'yt-player';
      wrap.insertBefore(holder, wrap.firstChild);
    }
    return holder;
  }

  function ensurePlayer() {
    var course = getCurrentCourse();
    if (!course) return;
    var video = course.videos[state.currentVideoIndex];
    if (!video) return;
    if (state.player && state.playerReady) {
      try {
        state.player.loadVideoById({ videoId: video.youtubeId, suggestedQuality: preferredQuality() });
      } catch (e) {
        recreatePlayer(video.youtubeId);
        return;
      }
      renderPlaylist();
      renderNowPlaying();
      updateNavButtons();
      return;
    }
    if (state.player) {
      // Player object exists but not ready yet; cue via recreation guard.
      try { state.player.destroy(); } catch (e) {}
      state.player = null;
      state.playerReady = false;
    }
    recreatePlayer(video.youtubeId);
  }

  function recreatePlayer(youtubeId) {
    // Reset the holder: the YT API replaces our div with an iframe sharing
    // the same id, so rebuild a clean div before each construction.
    try {
      var wrap = $('#player-wrapper');
      var old = $('#yt-player');
      if (wrap && old) {
        // If a previous YT instance owns this node, destroy it first.
        if (state.player && state.player.destroy) {
          try { state.player.destroy(); } catch (e) {}
          state.player = null;
          state.playerReady = false;
        }
        if (old.parentNode === wrap) wrap.removeChild(old);
      }
      if (wrap) {
        var fresh = document.createElement('div');
        fresh.id = 'yt-player';
        wrap.insertBefore(fresh, wrap.firstChild);
      }
    } catch (e) {}
    try {
      state.player = new window.YT.Player('yt-player', {
        videoId: youtubeId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          playsinline: 1,
          iv_load_policy: 3,
          fs: 0,
          vq: 'hd720' // request HD quality from the first frame
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    } catch (e) {
      showPlayerFallback('This video could not be loaded.');
    }
  }

  function onPlayerReady(event) {
    state.playerReady = true;
    hidePlayerFallback();
    try {
      var vol = $('#volume');
      var v = vol ? Number(vol.value) : 100;
      event.target.setVolume(isNaN(v) ? 100 : v);
      var speed = $('#speed');
      if (speed) event.target.setPlaybackRate(Number(speed.value) || 1);
    } catch (e) {}
    forceHighQuality();
    try { setTimeout(forceHighQuality, 1500); } catch (e) {}
    // Restore saved position for the same video (progress shape: {videoIndex, seconds}).
    if (state.pendingSeek && state.pendingSeek > 1) {
      try { event.target.seekTo(state.pendingSeek, true); } catch (e) {}
    }
    state.pendingSeek = 0;
    renderNowPlaying();
    renderPlaylist();
    updateNavButtons();
    updatePlayButton(false);
    startTick();
  }

  function onPlayerStateChange(event) {
    var YTNS = window.YT && window.YT.PlayerState;
    if (!YTNS) return;
    if (event.data === YTNS.PLAYING) {
      updatePlayButton(true);
      startTick();
      hidePlayerFallback();
      // NOTE: no quality forcing here — re-asserting HD on every play
      // fights YouTube's adaptive streaming and causes rebuffer loops.
    } else if (event.data === YTNS.PAUSED) {
      updatePlayButton(false);
      saveProgress(true);
    } else if (event.data === YTNS.ENDED) {
      updatePlayButton(false);
      saveProgress(true);
      goNext(true);
    } else if (event.data === YTNS.CUED) {
      renderNowPlaying();
      updateNavButtons();
      forceHighQuality();
    }
  }

  /**
   * Lock playback to the user's chosen quality (HD 720p by default).
   * Called on ready/cued and shortly after — never during PLAYING, so we
   * don't fight YouTube's adaptive streaming on slow networks.
   */
  function preferredQuality() {
    return state.qualityMode === 'auto' ? 'default' : (state.qualityMode || 'hd720');
  }

  function forceHighQuality() {
    try {
      if (!state.player || !state.playerReady) return;
      if (state.qualityMode === 'auto') return; // let YouTube adapt freely
      var want = state.qualityMode || 'hd720';
      var levels = state.player.getAvailableQualityLevels
        ? state.player.getAvailableQualityLevels() : [];
      if (levels.length && levels.indexOf(want) === -1) {
        want = levels.indexOf('hd720') !== -1 ? 'hd720' : levels[0];
      }
      if (!want || !state.player.setPlaybackQuality) return;
      var cur = state.player.getPlaybackQuality ? state.player.getPlaybackQuality() : '';
      if (cur !== want) state.player.setPlaybackQuality(want);
    } catch (e) { /* quality API unavailable — keep default */ }
  }

  function onPlayerError() {
    updatePlayButton(false);
    var course = getCurrentCourse();
    var hasNext = course && state.currentVideoIndex < course.videos.length - 1;
    showPlayerFallback(hasNext
      ? 'This video could not be played. Try the next video.'
      : 'This video could not be played. It may be unavailable or restricted.');
    var err = $('#player-error');
    if (err) {
      err.textContent = hasNext
        ? 'Video unavailable. Use “Next video” to continue.'
        : 'Video unavailable. Please go back to the course.';
      err.hidden = false;
    }
  }

  /**
   * Load the video at the given playlist index.
   * @param {number} index
   */
  function loadVideoAt(index) {
    var course = getCurrentCourse();
    if (!course || !course.videos || !course.videos.length) return;
    if (index < 0 || index >= course.videos.length) return;
    saveProgress(true);
    state.currentVideoIndex = index;
    state.pendingSeek = 0;
    var video = course.videos[index];
    hidePlayerFallback();
    if (state.player && state.playerReady) {
      try { state.player.loadVideoById({ videoId: video.youtubeId, suggestedQuality: preferredQuality() }); }
      catch (e) { recreatePlayer(video.youtubeId); }
    } else if (window.YT && window.YT.Player) {
      ensurePlayer();
    }
    var seek = $('#seek');
    if (seek) seek.value = '0';
    var cur = $('#time-current');
    if (cur) cur.textContent = '0:00';
    renderPlaylist();
    renderNowPlaying();
    updateNavButtons();
  }

  function goNext(auto) {
    var course = getCurrentCourse();
    if (!course) return;
    if (state.currentVideoIndex < course.videos.length - 1) {
      loadVideoAt(state.currentVideoIndex + 1);
    } else if (auto) {
      toast('Course complete! 🎉', 'success');
    }
  }

  function goPrev() {
    var course = getCurrentCourse();
    if (!course) return;
    var t = 0;
    try { t = state.player && state.playerReady ? state.player.getCurrentTime() : 0; } catch (e) {}
    if (t > 3) {
      try { state.player.seekTo(0, true); } catch (e) {}
      var cur = $('#time-current');
      if (cur) cur.textContent = '0:00';
      var seek = $('#seek');
      if (seek) seek.value = '0';
      return;
    }
    if (state.currentVideoIndex > 0) loadVideoAt(state.currentVideoIndex - 1);
  }

  function renderNowPlaying() {
    var course = getCurrentCourse();
    var titleEl = $('#now-playing');
    var subEl = $('#now-playing-course');
    var posEl = $('#playlist-position');
    if (!course) return;
    var video = course.videos[state.currentVideoIndex];
    if (!video) return;
    if (titleEl) titleEl.textContent = video.title;
    if (subEl) subEl.textContent = course.title;
    if (posEl) posEl.textContent = (state.currentVideoIndex + 1) + ' of ' + course.videos.length;
    updateNavButtons();
  }

  function renderPlaylist() {
    var list = $('#playlist');
    if (!list) return;
    var course = getCurrentCourse();
    list.innerHTML = '';
    if (!course) return;
    var lastSection = null;
    course.videos.forEach(function (v, idx) {
      if (v.section && v.section !== lastSection) {
        lastSection = v.section;
        var sh = document.createElement('li');
        sh.className = 'playlist__section';
        sh.textContent = v.section;
        list.appendChild(sh);
      }
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'playlist__item' + (idx === state.currentVideoIndex ? ' playlist__item--active' : '');
      if (idx === state.currentVideoIndex) btn.setAttribute('aria-current', 'true');
      btn.innerHTML =
        '<span class="playlist__index">' + (idx === state.currentVideoIndex ? '▶' : (idx + 1)) + '</span>' +
        '<span class="playlist__title">' + escapeHtml(v.title) + '</span>' +
        (v.duration ? '<span class="playlist__duration">' + escapeHtml(v.duration) + '</span>' : '');
      btn.addEventListener('click', function () { loadVideoAt(idx); });
      li.appendChild(btn);
      list.appendChild(li);
    });
    var active = list.querySelector('.playlist__item--active');
    if (active && active.scrollIntoView) {
      try { active.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
  }

  function updateNavButtons() {
    var course = getCurrentCourse();
    var prev = $('#btn-prev');
    var next = $('#btn-next');
    if (!course) return;
    if (prev) prev.disabled = state.currentVideoIndex <= 0;
    if (next) next.disabled = state.currentVideoIndex >= course.videos.length - 1;
    var fbNext = $('#btn-fallback-next');
    if (fbNext) fbNext.disabled = state.currentVideoIndex >= course.videos.length - 1;
  }

  function updatePlayButton(playing) {
    var btn = $('#btn-play');
    if (!btn) return;
    btn.textContent = playing ? '⏸' : '▶';
    btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    btn.setAttribute('title', playing ? 'Pause (Space)' : 'Play (Space)');
  }

  /* ============================= Controls ============================ */

  function bindControls() {
    loadQualityPref();
    // Anti-leak shield: the transparent layer above the frame owns every
    // pointer gesture, so users can never reach YouTube chrome or navigate away.
    var shield = $('#player-shield');
    if (shield) {
      shield.addEventListener('click', togglePlay);
      shield.addEventListener('dblclick', toggleFullscreen);
    }
    var wrap0 = $('#player-wrapper');
    if (wrap0) {
      // No right-click saves, no drags, no text selection on the stage.
      wrap0.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
      wrap0.addEventListener('dragstart', function (ev) { ev.preventDefault(); });
    }
    var play = $('#btn-play');
    if (play) play.addEventListener('click', togglePlay);
    var prev = $('#btn-prev');
    if (prev) prev.addEventListener('click', goPrev);
    var next = $('#btn-next');
    if (next) next.addEventListener('click', function () { goNext(false); });
    var fbNext = $('#btn-fallback-next');
    if (fbNext) fbNext.addEventListener('click', function () { goNext(false); });

    var seek = $('#seek');
    if (seek) {
      seek.addEventListener('input', function () {
        // Label-only update while dragging; the tick timer is paused via isSeeking.
        isSeeking = true;
        var d = 0;
        try { d = state.player && state.playerReady ? state.player.getDuration() : 0; } catch (e) {}
        if (d > 0) {
          var t = (Number(seek.value) / 100) * d;
          var cur = $('#time-current');
          if (cur) cur.textContent = formatTime(t);
        }
      });
      seek.addEventListener('change', function () {
        try {
          var d = state.player && state.playerReady ? state.player.getDuration() : 0;
          if (d > 0 && state.player) state.player.seekTo((Number(seek.value) / 100) * d, true);
        } catch (e) {}
        isSeeking = false;
      });
    }

    var mute = $('#btn-mute');
    if (mute) mute.addEventListener('click', toggleMute);
    var vol = $('#volume');
    if (vol) vol.addEventListener('input', function () {
      try {
        if (state.player && state.playerReady) {
          state.player.setVolume(Number(vol.value));
          if (Number(vol.value) > 0 && state.player.isMuted && state.player.isMuted()) state.player.unMute();
        }
      } catch (e) {}
      updateMuteButton();
    });
    var speed = $('#speed');
    if (speed) speed.addEventListener('change', function () {
      try { if (state.player && state.playerReady) state.player.setPlaybackRate(Number(speed.value)); } catch (e) {}
    });
    var quality = $('#quality');
    if (quality) quality.addEventListener('change', function () {
      state.qualityMode = quality.value;
      saveQualityPref();
      forceHighQuality();
    });
    var fs = $('#btn-fullscreen');
    if (fs) fs.addEventListener('click', toggleFullscreen);
  }

  function togglePlay() {
    if (!state.player || !state.playerReady) return;
    try {
      var YTNS = window.YT.PlayerState;
      var s = state.player.getPlayerState();
      if (s === YTNS.PLAYING) state.player.pauseVideo();
      else state.player.playVideo();
    } catch (e) {}
  }

  function toggleMute() {
    if (!state.player || !state.playerReady) return;
    try {
      if (state.player.isMuted()) state.player.unMute();
      else state.player.mute();
    } catch (e) {}
    updateMuteButton();
  }

  function updateMuteButton() {
    var btn = $('#btn-mute');
    if (!btn) return;
    var muted = false;
    try { muted = state.player && state.playerReady ? !!state.player.isMuted() : false; } catch (e) {}
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }

  function toggleFullscreen() {
    var wrap = $('#player-wrapper');
    if (!wrap) return;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (wrap.requestFullscreen) wrap.requestFullscreen();
    } catch (e) {}
  }

  function seekBy(delta) {
    if (!state.player || !state.playerReady) return;
    try {
      var t = state.player.getCurrentTime() || 0;
      var d = state.player.getDuration() || 0;
      var nt = Math.min(Math.max(0, t + delta), d > 0 ? d : t + delta);
      state.player.seekTo(nt, true);
    } catch (e) {}
  }

  function changeVolume(delta) {
    var vol = $('#volume');
    if (!vol) return;
    var v = Math.min(100, Math.max(0, Number(vol.value) + delta));
    vol.value = String(v);
    try {
      if (state.player && state.playerReady) {
        state.player.setVolume(v);
        if (v > 0 && state.player.isMuted && state.player.isMuted()) state.player.unMute();
      }
    } catch (e) {}
    updateMuteButton();
  }

  function startTick() {
    stopTick();
    state.tickTimer = setInterval(function () {
      if (!state.playerReady || !state.player) return;
      if (isSeeking) return;
      var t = 0, d = 0;
      try {
        t = state.player.getCurrentTime() || 0;
        d = state.player.getDuration() || 0;
      } catch (e) { return; }
      if (d > 0) {
        var seek = $('#seek');
        if (seek) seek.value = String((t / d) * 100);
        var cur = $('#time-current');
        if (cur) cur.textContent = formatTime(t);
        var tot = $('#time-total');
        if (tot) tot.textContent = formatTime(d);
        // Throttled autosave: at most every 5s during playback.
        var now = Date.now();
        if (now - lastProgressSave > 5000) {
          lastProgressSave = now;
          saveProgress(false);
        }
      }
    }, 250);
  }

  function stopTick() {
    if (state.tickTimer) { clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', function (ev) {
      var playerScreen = $('#screen-player');
      if (!playerScreen || playerScreen.hidden) return; // player shortcuts only
      var tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || (ev.target && ev.target.isContentEditable)) return;
      switch (ev.key) {
        case ' ':
        case 'k':
        case 'K':
          ev.preventDefault(); togglePlay(); break;
        case 'ArrowLeft':
          ev.preventDefault(); seekBy(-5); break;
        case 'ArrowRight':
          ev.preventDefault(); seekBy(5); break;
        case 'ArrowUp':
          ev.preventDefault(); changeVolume(5); break;
        case 'ArrowDown':
          ev.preventDefault(); changeVolume(-5); break;
        case 'm':
        case 'M':
          toggleMute(); break;
        case 'f':
        case 'F':
          toggleFullscreen(); break;
        case 'n':
        case 'N':
          goNext(false); break;
        case 'p':
        case 'P':
          goPrev(); break;
      }
    });
  }

  /* ============================= Progress ============================ */

  function loadProgress(courseId) {
    var all = readLS(progressKey(), {});
    if (!all || typeof all !== 'object') return null;
    var entry = all[courseId];
    if (!entry || typeof entry.videoIndex !== 'number') return null;
    return { videoIndex: entry.videoIndex, seconds: Number(entry.seconds) || 0 };
  }

  /**
   * Persist current playback position.
   * @param {boolean} force bypass the 5s throttle (pause/ended/unload)
   */
  function saveProgress(force) {
    try {
      if (!state.player || !state.playerReady) return;
      if (!state.currentCourseId) return;
      var now = Date.now();
      if (!force && now - lastProgressSave < 5000) return;
      lastProgressSave = now;
      var t = 0;
      try { t = state.player.getCurrentTime() || 0; } catch (e) { return; }
      var all = readLS(progressKey(), {});
      if (!all || typeof all !== 'object') all = {};
      all[state.currentCourseId] = { videoIndex: state.currentVideoIndex, seconds: Math.floor(t) };
      writeLS(progressKey(), all);
    } catch (e) { /* never crash on persistence */ }
  }

  /* ============================== Go ================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

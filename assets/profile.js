/* M2R-Academy profile page: avatar upload, name/bio, points/rank, my courses. */
(function () {
  'use strict';

  var MAX_AVATAR = 2 * 1024 * 1024;

  function esc(s) { return window.M2R.esc(s); }

  function progressPct(part) {
    var all = window.M2RAuth.getProgress();
    var e = all[part.id];
    var total = (part.videos || []).length;
    if (!e || !total) return 0;
    return Math.min(100, Math.round(((e.videoIndex || 0) / total) * 100));
  }

  var booted = false;

  function show(el, on) { var n = document.getElementById(el); if (n) n.hidden = !on; }

  function resolve(u) {
    show('profile-loading', false);
    if (!u) {
      // Signed out (e.g. second tab) after boot → revert to login state.
      show('profile-main', false); show('profile-need-login', true); return;
    }
    show('profile-need-login', false);
    show('profile-main', true);
    if (!booted) { booted = true; boot(u); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.M2RAuth.current().then(resolve);
    // Late-arriving session (slow SDK / second tab login) → render without reload.
    window.M2RAuth.onAuth(function (u) { resolve(u); });
    var retry = document.getElementById('profile-retry');
    if (retry) retry.addEventListener('click', function () {
      // SDK/CDN transient failure: full reload re-runs lazy loader cleanly.
      window.location.reload();
    });
  });

  function boot(u) {
    window.M2RFirebase.ready().then(function (fb) {
      return fb.db.collection('users').doc(u.uid).get().then(function (s) {
        return s.exists ? s.data() : {};
      });
    }).catch(function () { return {}; }).then(function (doc) {
      doc = doc || {};
      document.getElementById('pf-name-view').textContent = doc.displayName || u.displayName;
      document.getElementById('pf-points').textContent = doc.points || 0;
      document.getElementById('pf-name').value = doc.displayName || u.displayName || '';
      document.getElementById('pf-bio').value = doc.bio || '';
      if (doc.photoURL || u.photoURL) document.getElementById('pf-avatar').src = doc.photoURL || u.photoURL;
      rankOf(doc.points || 0);
      renderCourses();
      wireSave(u);
    });

    document.getElementById('pf-logout').addEventListener('click', function () {
      window.M2RAuth.logout();
    });
  }

  /** Rank = 1 + users with strictly more points (bounded; academy scale). */
  function rankOf(points) {
    window.M2RFirebase.ready().then(function (fb) {
      return fb.db.collection('users').where('points', '>', points).limit(1000).get();
    }).then(function (snap) {
      document.getElementById('pf-rank').textContent = '#' + (snap.size + 1);
    }).catch(function () {
      document.getElementById('pf-rank').textContent = '—';
    });
  }

  function renderCourses() {
    var box = document.getElementById('pf-courses');
    var enrolled = window.M2RAuth.getEnrolled();
    window.M2R.loadJSON('data/courses.json').then(function (d) {
      var parts = {};
      (d.tracks || []).forEach(function (t) {
        (t.parts || []).forEach(function (p) { parts[p.id] = p; });
      });
      box.innerHTML = '';
      if (!enrolled.length) {
        box.innerHTML = '<p style="color:var(--text-secondary)">—</p>';
        return;
      }
      enrolled.forEach(function (pid) {
        var p = parts[pid];
        if (!p) return;
        var pct = progressPct(p);
        var div = document.createElement('div');
        div.innerHTML = '<strong>' + esc(p.title) + '</strong>' +
          '<div style="height:6px;background:var(--bg-secondary);border-radius:999px;margin-top:6px">' +
          '<div style="height:100%;width:' + pct + '%;background:var(--accent);border-radius:999px"></div></div>';
        box.appendChild(div);
      });
    }).catch(function () {
      box.innerHTML = '<p>' + esc(window.M2R.t('common.load_fail')) + '</p>';
    });
  }

  function wireSave(u) {
    document.getElementById('pf-save').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      var name = document.getElementById('pf-name').value.trim().slice(0, 60);
      var bio = document.getElementById('pf-bio').value.trim().slice(0, 300);
      var file = document.getElementById('pf-avatar-input').files[0] || null;
      if (file && (file.size > MAX_AVATAR || (file.type || '').indexOf('image/') !== 0)) {
        window.M2R.toast('max 2MB, images only', 'error');
        btn.disabled = false;
        return;
      }
      window.M2RFirebase.ready().then(function (fb) {
        var ref = fb.db.collection('users').doc(u.uid);
        var chain = Promise.resolve(null);
        if (file) {
          var path = 'profile-pictures/' + u.uid + '/avatar';
          chain = fb.storage.ref(path).put(file)
            .then(function () { return fb.storage.ref(path).getDownloadURL(); });
        }
        return chain.then(function (url) {
          var patch = { displayName: name || u.displayName, bio: bio };
          if (url) patch.photoURL = url;
          return ref.set(patch, { merge: true }).then(function () { return url; });
        });
      }).then(function (url) {
        document.getElementById('pf-name-view').textContent =
          document.getElementById('pf-name').value.trim() || u.displayName;
        if (url) document.getElementById('pf-avatar').src = url;
        window.M2RAuth.refreshHeader();
        window.M2R.toast(window.M2R.t('profile.saved'), 'success');
      }).catch(function () {
        window.M2R.toast(window.M2R.t('auth.err_net'), 'error');
      }).then(function () { btn.disabled = false; });
    });
  }
})();

/* M2R-Academy protected player. Custom UI only; the frame is fully shielded. */
(function () {
  'use strict';

  var state = {
    part: null, track: null, videoIndex: 0,
    player: null, playerReady: false, tickTimer: null,
    qualityMode: 'hd720', pendingSeek: 0
  };
  var isSeeking = false;
  var lastCloudSave = 0;
  var ytApiPromise = null;
  var QUALITY_KEY = 'eduportal.quality';

  function $(s) { return document.querySelector(s); }
  function esc(s) { return window.M2R.esc(s); }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function loadQuality() {
    try {
      var q = window.localStorage.getItem(QUALITY_KEY);
      if (q === 'auto' || q === 'hd720' || q === 'large' || q === 'medium') state.qualityMode = q;
    } catch (e) {}
    var sel = $('#quality');
    if (sel) sel.value = state.qualityMode;
  }
  function saveQuality() {
    try { window.localStorage.setItem(QUALITY_KEY, state.qualityMode); } catch (e) {}
  }
  function wantQuality() {
    return state.qualityMode === 'auto' ? 'default' : state.qualityMode;
  }

  /** Re-assert chosen quality on ready/cued only — never during PLAYING. */
  function forceQuality() {
    try {
      if (!state.player || !state.playerReady || state.qualityMode === 'auto') return;
      var want = state.qualityMode;
      var levels = state.player.getAvailableQualityLevels ? state.player.getAvailableQualityLevels() : [];
      if (levels.length && levels.indexOf(want) === -1) {
        want = levels.indexOf('hd720') !== -1 ? 'hd720' : levels[0];
      }
      if (!want || !state.player.setPlaybackQuality) return;
      var cur = state.player.getPlaybackQuality ? state.player.getPlaybackQuality() : '';
      if (cur !== want) state.player.setPlaybackQuality(want);
    } catch (e) {}
  }

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytApiPromise) return ytApiPromise;
    ytApiPromise = new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; showFallback(); reject(new Error('timeout')); }
      }, 10000);
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try { if (typeof prev === 'function') prev(); } catch (e) {}
        if (!done) { done = true; clearTimeout(timer); resolve(); }
      };
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = function () {
        if (!done) { done = true; clearTimeout(timer); showFallback(); reject(new Error('blocked')); }
      };
      document.head.appendChild(tag);
    });
    return ytApiPromise;
  }

  function showFallback(msg) {
    var fb = $('#player-fallback');
    if (fb) fb.hidden = false;
    var err = $('#player-error');
    if (err) {
      err.textContent = msg || window.M2R.t('watch.unavailable');
      err.hidden = false;
    }
  }
  function hideFallback() {
    var fb = $('#player-fallback');
    if (fb) fb.hidden = true;
    var err = $('#player-error');
    if (err) { err.textContent = ''; err.hidden = true; }
  }

  function resetHolder() {
    // Stop all API traffic BEFORE touching the iframe — prevents YouTube's
    // internal postMessage poller from firing at a half-destroyed window
    // (the 'target origin mismatch' console spam).
    stopTick();
    state.playerReady = false;
    var wrap = $('#player-wrapper');
    var old = $('#yt-player');
    if (wrap && old) {
      if (state.player && state.player.destroy) {
        try { state.player.destroy(); } catch (e) {}
      }
      state.player = null;
      if (old.parentNode === wrap) wrap.removeChild(old);
    }
    if (wrap) {
      var fresh = document.createElement('div');
      fresh.id = 'yt-player';
      wrap.insertBefore(fresh, wrap.firstChild);
    }
  }

  function createPlayer(youtubeId) {
    resetHolder();
    try {
      state.player = new window.YT.Player('yt-player', {
        host: 'https://www.youtube-nocookie.com',
        videoId: youtubeId,
        playerVars: {
          controls: 0, rel: 0, modestbranding: 1, disablekb: 1,
          playsinline: 1, iv_load_policy: 3, fs: 0, vq: 'hd720'
        },
        events: { onReady: onReady, onStateChange: onState, onError: onError }
      });
    } catch (e) { showFallback(); }
  }

  function onReady(ev) {
    state.playerReady = true;
    hideFallback();
    try {
      ev.target.setVolume(Number(($('#volume') || {}).value || 100));
      ev.target.setPlaybackRate(Number(($('#speed') || {}).value || 1));
    } catch (e) {}
    forceQuality();
    setTimeout(forceQuality, 1500);
    if (state.pendingSeek > 1) {
      try { ev.target.seekTo(state.pendingSeek, true); } catch (e) {}
    }
    state.pendingSeek = 0;
    renderAll();
    setPlayIcon(false);
    startTick();
  }

  function onState(ev) {
    var S = window.YT && window.YT.PlayerState;
    if (!S) return;
    if (ev.data === S.PLAYING) {
      setPlayIcon(true);
      startTick();
      hideFallback();
    } else if (ev.data === S.PAUSED) {
      setPlayIcon(false);
      persist(true);
    } else if (ev.data === S.ENDED) {
      setPlayIcon(false);
      persist(true);
      next(false, true);
    } else if (ev.data === S.CUED) {
      renderAll();
      forceQuality();
    }
  }

  function onError() {
    stopTick();
    setPlayIcon(false);
    var last = state.part.videos.length - 1;
    showFallback(state.videoIndex < last ? undefined : window.M2R.t('watch.unavailable'));
  }

  function setPlayIcon(playing) {
    var b = $('#btn-play');
    if (!b) return;
    b.textContent = playing ? '⏸' : '▶';
    b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function videos() { return (state.part && state.part.videos) || []; }

  function loadVideoAt(i) {
    if (i < 0 || i >= videos().length) return;
    persist(true);
    state.videoIndex = i;
    state.pendingSeek = 0;
    hideFallback();
    var v = videos()[i];
    if (state.player && state.playerReady) {
      try { state.player.loadVideoById({ videoId: v.youtubeId, suggestedQuality: wantQuality() }); }
      catch (e) { createPlayer(v.youtubeId); }
    } else if (window.YT && window.YT.Player) {
      createPlayer(v.youtubeId);
    }
    var sk = $('#seek');
    if (sk) sk.value = '0';
    var tc = $('#time-current');
    if (tc) tc.textContent = '0:00';
    renderAll();
  }

  function next(fromBtn, auto) {
    if (state.videoIndex < videos().length - 1) loadVideoAt(state.videoIndex + 1);
    else if (auto) window.M2R.toast('🎉', 'success');
  }

  function prev() {
    var t = 0;
    try { t = state.player && state.playerReady ? state.player.getCurrentTime() : 0; } catch (e) {}
    if (t > 3) {
      try { state.player.seekTo(0, true); } catch (e) {}
      return;
    }
    if (state.videoIndex > 0) loadVideoAt(state.videoIndex - 1);
  }

  function togglePlay() {
    if (!state.player || !state.playerReady) return;
    try {
      var s = state.player.getPlayerState();
      if (s === window.YT.PlayerState.PLAYING) state.player.pauseVideo();
      else state.player.playVideo();
    } catch (e) {}
  }

  function toggleMute() {
    if (!state.player || !state.playerReady) return;
    try {
      if (state.player.isMuted()) state.player.unMute();
      else state.player.mute();
    } catch (e) {}
    paintMute();
  }

  function paintMute() {
    var b = $('#btn-mute');
    if (!b) return;
    var m = false;
    try { m = !!(state.player && state.playerReady && state.player.isMuted()); } catch (e) {}
    b.textContent = m ? '🔇' : '🔊';
  }

  function toggleFullscreen() {
    var w = $('#player-wrapper');
    if (!w) return;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (w.requestFullscreen) w.requestFullscreen();
    } catch (e) {}
  }

  function seekBy(d) {
    if (!state.player || !state.playerReady) return;
    try {
      var t = state.player.getCurrentTime() || 0;
      var dur = state.player.getDuration() || 0;
      state.player.seekTo(Math.min(Math.max(0, t + d), dur > 0 ? dur : t + d), true);
    } catch (e) {}
  }

  function bumpVolume(d) {
    var v = $('#volume');
    if (!v) return;
    v.value = String(Math.min(100, Math.max(0, Number(v.value) + d)));
    v.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Best-effort captions toggle (depends on video tracks). */
  var captionsOn = false;
  function toggleCaptions() {
    try {
      if (!state.player || !state.playerReady) return;
      captionsOn = !captionsOn;
      if (captionsOn) {
        try { state.player.loadModule('captions'); } catch (e) {}
        try { state.player.setOption('captions', 'track', { languageCode: 'ar' }); }
        catch (e) { try { state.player.setOption('captions', 'track', {}); } catch (_e) {} }
      } else {
        try { state.player.setOption('captions', 'track', {}); } catch (e) {}
        try { state.player.unloadModule('captions'); } catch (e) {}
      }
    } catch (e) {}
  }

  function applyQuality(mode) {
    state.qualityMode = mode;
    saveQuality();
    var sel = $('#quality');
    if (sel) sel.value = mode;
    if (mode === 'auto') return; // adaptive takes over
    forceQuality();
  }

  function startTick() {
    stopTick();
    state.tickTimer = setInterval(function () {
      if (!state.playerReady || !state.player || isSeeking) return;
      var t = 0, d = 0;
      try {
        t = state.player.getCurrentTime() || 0;
        d = state.player.getDuration() || 0;
      } catch (e) { return; }
      if (d > 0) {
        var sk = $('#seek');
        if (sk) sk.value = String((t / d) * 100);
        var tc = $('#time-current');
        if (tc) tc.textContent = fmt(t);
        var tt = $('#time-total');
        if (tt) tt.textContent = fmt(d);
        if (Date.now() - lastCloudSave > 30000) {
          lastCloudSave = Date.now();
          persist(false);
        }
      }
    }, 250);
  }
  function stopTick() {
    if (state.tickTimer) { clearInterval(state.tickTimer); state.tickTimer = null; }
  }

  /** Persist position locally and to cloud (throttled unless forced). */
  function persist(force) {
    try {
      if (!state.player || !state.playerReady || !state.part) return;
      var t = 0;
      try { t = state.player.getCurrentTime() || 0; } catch (e) { return; }
      var all = window.M2RAuth.getProgress();
      all[state.part.id] = { videoIndex: state.videoIndex, seconds: Math.floor(t) };
      if (force) {
        window.M2RAuth.saveProgress(all);
        lastCloudSave = Date.now();
      } else {
        window.M2RAuth.saveProgress(all);
      }
    } catch (e) {}
  }

  function renderAll() {
    var v = videos()[state.videoIndex];
    if (!v) return;
    var L = window.M2R.lang();
    document.getElementById('now-playing').textContent = v.title;
    document.getElementById('now-playing-course').textContent =
      (L === 'en' ? (state.track.titleEn || state.track.title) : state.track.title);
    document.getElementById('playlist-position').textContent =
      (state.videoIndex + 1) + ' / ' + videos().length;
    renderPlaylist();
    var prev = $('#btn-prev'), nextB = $('#btn-next');
    if (prev) prev.disabled = state.videoIndex <= 0;
    if (nextB) nextB.disabled = state.videoIndex >= videos().length - 1;
    var fb = $('#btn-fallback-next');
    if (fb) fb.disabled = state.videoIndex >= videos().length - 1;
    paintMute();
  }

  function renderPlaylist() {
    var list = document.getElementById('playlist');
    list.innerHTML = '';
    var lastSec = null;
    videos().forEach(function (v, i) {
      if (v.section && v.section !== lastSec) {
        lastSec = v.section;
        var sh = document.createElement('li');
        sh.className = 'playlist__section';
        sh.textContent = v.section;
        list.appendChild(sh);
      }
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'playlist__item' + (i === state.videoIndex ? ' playlist__item--active' : '');
      if (i === state.videoIndex) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<span>' + (i === state.videoIndex ? '▶' : (i + 1)) + '</span>' +
        '<span class="playlist__title">' + esc(v.title) + '</span>' +
        (v.duration ? '<span class="playlist__duration">' + esc(v.duration) + '</span>' : '');
      b.addEventListener('click', function () { loadVideoAt(i); });
      li.appendChild(b);
      list.appendChild(li);
    });
    var act = list.querySelector('.playlist__item--active');
    if (act && act.scrollIntoView) {
      try { act.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
  }

  function bind() {
    loadQuality();
    $('#btn-play').addEventListener('click', togglePlay);
    $('#btn-prev').addEventListener('click', prev);
    $('#btn-next').addEventListener('click', function () { next(true, false); });
    $('#btn-fallback-next').addEventListener('click', function () { next(true, false); });
    var shield = $('#player-shield');
    if (shield) {
      shield.addEventListener('click', togglePlay);
      shield.addEventListener('dblclick', toggleFullscreen);
    }
    var wrap = $('#player-wrapper');
    if (wrap) {
      wrap.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      wrap.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }
    var seek = $('#seek');
    seek.addEventListener('input', function () {
      isSeeking = true;
      var d = 0;
      try { d = state.player && state.playerReady ? state.player.getDuration() : 0; } catch (e) {}
      if (d > 0) $('#time-current').textContent = fmt((Number(seek.value) / 100) * d);
    });
    seek.addEventListener('change', function () {
      try {
        var d = state.player && state.playerReady ? state.player.getDuration() : 0;
        if (d > 0 && state.player) state.player.seekTo((Number(seek.value) / 100) * d, true);
      } catch (e) {}
      isSeeking = false;
    });
    $('#btn-mute').addEventListener('click', toggleMute);
    $('#volume').addEventListener('input', function () {
      try {
        if (state.player && state.playerReady) {
          state.player.setVolume(Number(this.value));
          if (Number(this.value) > 0 && state.player.isMuted && state.player.isMuted()) {
            state.player.unMute();
          }
        }
      } catch (e) {}
      paintMute();
    });
    $('#speed').addEventListener('change', function () {
      try { if (state.player && state.playerReady) state.player.setPlaybackRate(Number(this.value)); } catch (e) {}
    });
    $('#quality').addEventListener('change', function () { applyQuality(this.value); });
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);

    document.addEventListener('keydown', function (ev) {
      var tag = (ev.target && ev.target.tagName ? ev.target.tagName : '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' ||
          (ev.target && ev.target.isContentEditable)) return;
      switch (ev.key) {
        case ' ': case 'k': case 'K': ev.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': ev.preventDefault(); seekBy(-5); break;
        case 'ArrowRight': ev.preventDefault(); seekBy(5); break;
        case 'ArrowUp': ev.preventDefault(); bumpVolume(5); break;
        case 'ArrowDown': ev.preventDefault(); bumpVolume(-5); break;
        case 'm': case 'M': toggleMute(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'n': case 'N': next(true, false); break;
        case 'p': case 'P': prev(); break;
        case 'c': case 'C': toggleCaptions(); break;
        case '1': applyQuality('auto'); break;
        case '2': applyQuality('hd720'); break;
        case '3': applyQuality('large'); break;
        case '4': applyQuality('medium'); break;
      }
    });
    window.addEventListener('beforeunload', function () { persist(true); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bind();
    var id = window.M2R.getParam('course');
    window.M2R.loadJSON('data/courses.json').then(function (d) {
      var found = null, tr = null;
      (d.tracks || []).forEach(function (t) {
        (t.parts || []).forEach(function (p) {
          if (p.id === id && !p.comingSoon) { found = p; tr = t; }
        });
      });
      if (!found) { failBoot(id, 'courses.html'); return; }
      // Cloud-first gate: new-device logins must see cloud unlocks, not just LS.
      window.M2RAuth.current().then(function () {
        return window.M2RAuth.pullCloud().catch(function () {});
      }).then(function () {
        if (window.M2RAuth.getEnrolled().indexOf(found.id) === -1) {
          window.location.href = 'enroll.html?course=' + encodeURIComponent(found.id);
          return;
        }
        bootPlayer();
      });
      function bootPlayer() {
      state.part = found;
      state.track = tr;
      var saved = window.M2RAuth.getProgress()[found.id];
      var idx = saved && typeof saved.videoIndex === 'number' ? saved.videoIndex : 0;
      if (idx < 0 || idx >= found.videos.length) idx = 0;
      state.videoIndex = idx;
      state.pendingSeek = saved ? (Number(saved.seconds) || 0) : 0;
      renderAll();
      loadYouTubeApi().then(function () { createPlayer(found.videos[idx].youtubeId); })
        .catch(function () {
          // YouTube blocked/offline: stay on page with fallback + Next — no redirect.
          showFallback();
          try {
            var nb = document.getElementById('btn-fallback-next');
            if (nb && !nb._wired) {
              nb._wired = true;
              nb.addEventListener('click', function () {
                ytApiPromise = null; hideFallback();
                loadYouTubeApi().then(function () {
                  createPlayer(found.videos[state.videoIndex].youtubeId);
                }).catch(function () { showFallback(); });
              });
            }
          } catch (e) {}
        });
      } // end bootPlayer
      function failBoot(badId, fallback) {
        try {
          var e = document.getElementById('player-error');
          if (e && window.M2R) {
            e.textContent = window.M2R.t('common.load_fail') + (badId ? ' (' + badId + ')' : '');
            e.hidden = false;
          }
        } catch (err) {}
        setTimeout(function () { window.location.href = fallback; }, 2500);
      }
    }).catch(function () { failBoot(id, 'courses.html'); });
  });
})();

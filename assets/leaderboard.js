/* M2R-Academy leaderboard: live top-50 by points, ties share rank. */
(function () {
  'use strict';

  function esc(s) { return window.M2R.esc(s); }

  document.addEventListener('DOMContentLoaded', function () {
    window.M2RAuth.current().then(function (u) {
      if (!u) document.getElementById('lb-login-hint').hidden = false;
      boot(u ? u.uid : null);
    });
    // Late session → re-render with highlight, hide hint.
    window.M2RAuth.onAuth(function (u) {
      var hint = document.getElementById('lb-login-hint');
      if (hint) hint.hidden = !!u;
      boot(u ? u.uid : null);
    });
    window.M2R.onLang(function () { boot(window.M2RAuth.me() ? window.M2RAuth.me().uid : null); });
  });

  var unsub = null;

  function boot(myUid) {
    if (typeof unsub === 'function') { try { unsub(); } catch (e) {} unsub = null; }
    window.M2RFirebase.ready().then(function (fb) {
      // Active competition banner (optional).
      fb.db.collection('competitions').where('active', '==', true).limit(1).get()
        .then(function (snap) {
          var box = document.getElementById('comp-banner');
          if (!snap.empty && box) {
            var c = snap.docs[0].data() || {};
            box.innerHTML = '<p class="quote">🏆 ' + esc(c.title || '') + '</p>';
          }
        }).catch(function () {});
      // Live board (requires login per Firestore rules — public sees login CTA).
      unsub = fb.db.collection('users').orderBy('points', 'desc').limit(50)
        .onSnapshot(function (snap) {
          render(snap.docs.map(function (d) {
            var v = d.data() || {};
            v.uid = d.id;
            return v;
          }), myUid);
        }, function (err) {
          if (!myUid) {
            // Logged-out: rules deny users read — show login hint, not an error.
            var t = document.getElementById('lb-table');
            if (t) t.hidden = true;
            var hint = document.getElementById('lb-login-hint');
            if (hint) hint.hidden = false;
            return;
          }
          var e = document.getElementById('lb-error');
          e.textContent = window.M2R.t('common.load_fail');
          e.hidden = false;
        });
    }).catch(function () {
      var e = document.getElementById('lb-error');
      e.textContent = window.M2R.t('common.load_fail');
      e.hidden = false;
    });
  }

  /**
   * Competition ranking: equal points share a rank, next rank skips.
   * @param {Array} rows sorted desc by points
   */
  function render(rows, myUid) {
    var body = document.getElementById('lb-body');
    var table = document.getElementById('lb-table');
    var empty = document.getElementById('lb-empty');
    body.innerHTML = '';
    var visible = rows.filter(function (r) { return !r.banned; });
    table.hidden = !visible.length;
    empty.hidden = !!visible.length;
    var lastPts = null, rank = 0;
    visible.forEach(function (r, i) {
      if (r.points !== lastPts) { rank = i + 1; lastPts = r.points; }
      var tr = document.createElement('tr');
      if (r.uid === myUid) tr.className = 'me';
      var av = r.photoURL
        ? '<img class="lb-avatar" src="' + esc(r.photoURL) + '" alt="" loading="lazy" />'
        : '<span class="lb-avatar" style="display:inline-flex;align-items:center;justify-content:center">👤</span>';
      tr.innerHTML = '<td>#' + rank + '</td><td>' + av + '</td>' +
        '<td>' + esc(r.displayName || r.email || '?') + '</td>' +
        '<td><strong>' + (r.points || 0) + '</strong></td>' +
        '<td>' + ((r.enrolledCourses || []).length) + '</td>';
      body.appendChild(tr);
    });
  }
})();

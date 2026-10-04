/* M2R-Academy admin: users/points/bans, announcements, projects, competitions.
   Gated by ADMIN_EMAILS in auth.js. Hard deletes happen in Firebase Console. */
(function () {
  'use strict';

  function esc(s) { return window.M2R.esc(s); }
  function FV() { return window.firebase.firestore.FieldValue; }

  document.addEventListener('DOMContentLoaded', function () {
    window.M2RAuth.requireAdmin(function () {
      document.getElementById('admin-main').hidden = false;
      boot();
    });
  });

  function boot() {
    window.M2RFirebase.ready().then(function (fb) {
      var users = fb.db.collection('users');
      var T = window.M2R.t.bind(window.M2R);

      // Users table (live).
      users.orderBy('points', 'desc').limit(100).onSnapshot(function (snap) {
        var tb = document.getElementById('admin-users');
        tb.innerHTML = '';
        snap.forEach(function (d) {
          var u = d.data() || {};
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + esc(u.displayName || u.email) +
            (u.banned ? ' <span class="chip chip--warning">' + esc(T('admin.banned')) + '</span>' : '') + '</td>' +
            '<td><strong>' + (u.points || 0) + '</strong></td><td></td>';
          var cell = tr.lastChild;
          [['+10', 10], ['+50', 50], ['−10', -10]].forEach(function (pair) {
            var b = document.createElement('button');
            b.className = 'btn btn-ghost btn-sm';
            b.textContent = pair[0];
            b.addEventListener('click', function () {
              users.doc(d.id).update({ points: FV().increment(pair[1]) }).then(function () {
                fb.db.collection('points_log').add({
                  userId: d.id,
                  delta: pair[1],
                  by: (window.M2RAuth.me() && window.M2RAuth.me().email) || 'admin',
                  createdAt: FV().serverTimestamp()
                }).catch(function () {});
              }).catch(function () {});
            });
            cell.appendChild(b);
          });
          var ban = document.createElement('button');
          ban.className = 'btn btn-ghost btn-sm';
          ban.textContent = u.banned ? T('admin.unban') : T('admin.ban');
          ban.addEventListener('click', function () {
            users.doc(d.id).update({ banned: !u.banned }).catch(function () {});
          });
          cell.appendChild(ban);
          tb.appendChild(tr);
        });
      });

      // Announcements -> settings/main.
      var settings = fb.db.collection('settings').doc('main');
      settings.get().then(function (s) {
        if (s.exists && s.data().announcement) {
          document.getElementById('admin-ann').value = s.data().announcement;
        }
      }).catch(function () {});
      document.getElementById('admin-ann-save').addEventListener('click', function () {
        settings.set({
          announcement: document.getElementById('admin-ann').value.slice(0, 500),
          updatedAt: FV().serverTimestamp()
        }, { merge: true }).then(function () {
          window.M2R.toast(T('admin.saved'), 'success');
        }).catch(function () {});
      });

      // Projects editor (siteProjects collection; projects page merges it in).
      var projs = fb.db.collection('siteProjects');
      var renderProjs = function () {
        projs.orderBy('createdAt', 'desc').limit(50).get().then(function (snap) {
          var box = document.getElementById('admin-projects');
          box.innerHTML = '';
          snap.forEach(function (d) {
            var p = d.data() || {};
            var row = document.createElement('div');
            row.className = 'row-actions';
            row.style.cssText = 'align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:10px;padding:8px 12px;margin-bottom:8px';
            row.innerHTML = '<strong>' + esc(p.title || d.id) + '</strong>';
            var del = document.createElement('button');
            del.className = 'btn btn-ghost btn-sm';
            del.textContent = T('admin.del');
            del.addEventListener('click', function () {
              if (window.confirm(T('admin.del_confirm'))) projs.doc(d.id).delete().catch(function () {});
            });
            row.appendChild(del);
            box.appendChild(row);
          });
        }).catch(function () {});
      };
      renderProjs();
      document.getElementById('admin-proj-add').addEventListener('click', function () {
        var title = document.getElementById('admin-proj-title').value.trim();
        if (!title) return;
        projs.add({
          title: title, student: '', track: 'web', image: '',
          description: '', link: '',
          createdAt: FV().serverTimestamp()
        }).then(function () {
          document.getElementById('admin-proj-title').value = '';
          renderProjs();
          window.M2R.toast(T('admin.saved'), 'success');
        }).catch(function () {});
      });

      // Competitions CRUD.
      var comps = fb.db.collection('competitions');
      var renderComps = function () {
        comps.orderBy('createdAt', 'desc').limit(20).get().then(function (snap) {
          var box = document.getElementById('admin-comps');
          box.innerHTML = '';
          snap.forEach(function (d) {
            var c = d.data() || {};
            var row = document.createElement('div');
            row.className = 'row-actions';
            row.style.cssText = 'align-items:center;justify-content:space-between;border:1px solid var(--border);border-radius:10px;padding:8px 12px;margin-bottom:8px';
            row.innerHTML = '<strong>' + esc(c.title || d.id) + '</strong>' +
              (c.active ? ' <span class="chip chip--success">●</span>' : '');
            var wrap = document.createElement('span');
            wrap.className = 'row-actions';
            var tog = document.createElement('button');
            tog.className = 'btn btn-ghost btn-sm';
            tog.textContent = c.active ? '⏸' : '▶';
            tog.setAttribute('aria-label', 'toggle');
            tog.addEventListener('click', function () {
              comps.doc(d.id).update({ active: !c.active }).then(renderComps).catch(function () {});
            });
            var del = document.createElement('button');
            del.className = 'btn btn-ghost btn-sm';
            del.textContent = T('admin.del');
            del.addEventListener('click', function () {
              if (window.confirm(T('admin.del_confirm'))) {
                comps.doc(d.id).delete().then(renderComps).catch(function () {});
              }
            });
            wrap.appendChild(tog);
            wrap.appendChild(del);
            row.appendChild(wrap);
            box.appendChild(row);
          });
        }).catch(function () {});
      };
      renderComps();
      document.getElementById('admin-comp-add').addEventListener('click', function () {
        var title = document.getElementById('admin-comp-title').value.trim();
        if (!title) return;
        comps.add({
          title: title, active: true,
          createdAt: FV().serverTimestamp()
        }).then(function () {
          document.getElementById('admin-comp-title').value = '';
          renderComps();
        }).catch(function () {});
      });
    }).catch(function () {
      var d = document.getElementById('admin-denied');
      if (d) { d.textContent = window.M2R.t('common.load_fail'); d.hidden = false; }
    });
  }
})();

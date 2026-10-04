/* M2R-Academy auth + user-data layer. Email/password via Firebase.
   Everything fails soft when Firebase is unconfigured/offline. */
(function () {
  'use strict';

  // Admin allow-list — Mustafa (owner).
  var ADMIN_EMAILS = ['darkstorm885@gmail.com'];

  var LS_ENROLLED = 'eduportal.enrolled';
  var LS_PROGRESS = 'eduportal.progress';

  var me = null; // {uid, email, displayName, photoURL} | null
  var meDoc = null;
  var listeners = [];
  var watched = false;

  function readLS(k, fb) {
    try { var v = window.localStorage.getItem(k); return v == null ? fb : JSON.parse(v); }
    catch (e) { return fb; }
  }
  function writeLS(k, v) {
    try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  function errKey(err) {
    var c = (err && err.code) || '';
    if (!window.navigator.onLine) return 'auth.err_net';
    switch (c) {
      case 'auth/email-already-in-use': return 'auth.err_used';
      case 'auth/invalid-email': return 'auth.err_bad';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'auth.err_bad';
      case 'auth/weak-password': return 'auth.err_short';
      case 'auth/too-many-requests': return 'auth.err_net';
      default: return 'auth.err_net';
    }
  }

  function shapeUser(fbUser, doc) {
    return {
      uid: fbUser.uid,
      email: (fbUser.email || '').toLowerCase(),
      displayName: (doc && doc.displayName) || fbUser.displayName ||
        ((fbUser.email || '').split('@')[0]),
      photoURL: (doc && doc.photoURL) || fbUser.photoURL || ''
    };
  }

  function notify() { listeners.forEach(function (fn) { try { fn(me); } catch (e) {} }); }

  /* Auth-restore gate: Firebase restores the session async, so currentUser
     is null until the first onAuthStateChanged fires. All callers wait here. */
  var authDone = false;
  var authResolve = null;
  var authInit = new Promise(function (res) { authResolve = res; });
  function settleAuth() {
    if (!authDone) { authDone = true; try { authResolve(me); } catch (e) {} }
  }

  function handleBannedFlag(fb, doc) {
    if (doc && doc.banned) {
      fb.auth.signOut().catch(function () {});
      me = null; meDoc = null; notify(); refreshHeader();
      try {
        if (window.M2R && window.M2R.toast) window.M2R.toast(window.M2R.t('auth.err_banned'), 'error');
      } catch (e) {}
      if (window.location.pathname.indexOf('login.html') === -1) {
        window.location.href = 'login.html?banned=1';
      } else {
        var be = document.getElementById('login-error');
        if (be && window.M2R) { be.textContent = window.M2R.t('auth.err_banned'); be.hidden = false; }
      }
      return true;
    }
    return false;
  }

  function watch() {
    if (watched) return;
    watched = true;
    window.M2RFirebase.ready().then(function (fb) {
      fb.auth.onAuthStateChanged(function (fu) {
        if (!fu) { me = null; meDoc = null; notify(); refreshHeader(); settleAuth(); return; }
        fu.getIdToken().catch(function () {});
        fb.db.collection('users').doc(fu.uid).get()
          .then(function (s) { meDoc = s.exists ? s.data() : null; })
          .catch(function () { meDoc = null; })
          .then(function () {
            if (handleBannedFlag(fb, meDoc)) { settleAuth(); return; }
            me = shapeUser(fu, meDoc); notify(); refreshHeader(); settleAuth();
          });
      });
    }).catch(function () { /* demo/offline: header stays logged-out */ settleAuth(); });
  }

  /** Resolve with current user or null (never rejects). Waits for restore. */
  function current() {
    watch();
    return authInit.then(function () { return me; });
  }

  function onAuth(fn) { listeners.push(fn); }

  function signup(name, email, pass) {
    return window.M2RFirebase.ready().then(function (fb) {
      return fb.auth.createUserWithEmailAndPassword(email, pass).then(function (cred) {
        var disp = name || email.split('@')[0];
        var p = cred.user.updateProfile
          ? cred.user.updateProfile({ displayName: disp }).catch(function () {}) : Promise.resolve();
        return p.then(function () {
          return fb.db.collection('users').doc(cred.user.uid).set({
            uid: cred.user.uid, email: email.toLowerCase(), displayName: disp,
            photoURL: '', bio: '', country: '', role: 'student', points: 0,
            enrolledCourses: readLS(LS_ENROLLED, []), banned: false
          }).catch(function () {});
        }).then(function () {
          return fb.db.collection('users').doc(cred.user.uid).set({
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch(function () {});
        }).then(function () {
          meDoc = {
            displayName: disp, email: email.toLowerCase(), photoURL: '',
            points: 0, banned: false
          };
          me = shapeUser(cred.user, meDoc); notify(); refreshHeader();
          if (!authDone) settleAuth();
          return cred.user;
        });
      });
    });
  }

  function login(email, pass) {
    return window.M2RFirebase.ready().then(function (fb) {
      return fb.auth.signInWithEmailAndPassword(email, pass).then(function (cred) {
        fb.db.collection('users').doc(cred.user.uid).set({
          lastLogin: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(function () {});
        return fb.db.collection('users').doc(cred.user.uid).get()
          .then(function (s) { meDoc = s.exists ? s.data() : null; })
          .catch(function () { meDoc = null; })
          .then(function () {
            me = shapeUser(cred.user, meDoc); notify(); refreshHeader();
            if (!authDone) settleAuth();
            return cred.user;
          });
      });
    });
  }

  function logout() {
    return window.M2RFirebase.ready()
      .then(function (fb) { return fb.auth.signOut().catch(function () {}); })
      .catch(function () {})
      .then(function () { window.location.href = 'login.html'; });
  }

  function isAdmin(user) {
    var u = user || me;
    if (!u || !u.email) return false;
    return ADMIN_EMAILS.indexOf(u.email.toLowerCase()) !== -1;
  }

  function requireAuth() {
    current().then(function (u) { if (!u) window.location.href = 'login.html'; });
  }

  function requireAdmin(next) {
    current().then(function (u) {
      if (!u || !isAdmin(u)) {
        var box = document.getElementById('admin-denied');
        var main = document.getElementById('admin-main');
        if (box) box.hidden = false;
        if (main) main.hidden = true;
        return;
      }
      if (typeof next === 'function') next(u);
    });
  }

  function redirectIfAuthed() {
    current().then(function (u) { if (u) window.location.href = 'profile.html'; });
  }

  /* ---- Per-device enrollments, mirrored to cloud when logged in ---- */
  function getEnrolled() {
    var l = readLS(LS_ENROLLED, []);
    return Array.isArray(l) ? l : [];
  }

  function setEnrolled(list) {
    writeLS(LS_ENROLLED, list);
    if (!me) return Promise.resolve();
    return window.M2RFirebase.ready().then(function (fb) {
      return fb.db.collection('users').doc(me.uid).set({ enrolledCourses: list }, { merge: true });
    }).catch(function () {});
  }

  function addEnrollment(courseId) {
    var list = getEnrolled();
    if (list.indexOf(courseId) === -1) list.push(courseId);
    return setEnrolled(list);
  }

  function getProgress() { return readLS(LS_PROGRESS, {}) || {}; }

  function saveProgress(all) {
    writeLS(LS_PROGRESS, all);
    if (!me) return Promise.resolve();
    return window.M2RFirebase.ready().then(function (fb) {
      return fb.db.collection('users').doc(me.uid).set({ progress: all }, { merge: true });
    }).catch(function () {});
  }

  function pullCloud() {
    if (!me) return Promise.resolve();
    return window.M2RFirebase.ready().then(function (fb) {
      return fb.db.collection('users').doc(me.uid).get().then(function (s) {
        if (!s.exists) return;
        var d = s.data() || {};
        if (Array.isArray(d.enrolledCourses)) writeLS(LS_ENROLLED, d.enrolledCourses);
        if (d.progress && typeof d.progress === 'object') writeLS(LS_PROGRESS, d.progress);
        meDoc = d;
        me.displayName = d.displayName || me.displayName;
        me.photoURL = d.photoURL || me.photoURL;
      });
    }).catch(function () {});
  }

  function refreshHeader() {
    var slot = document.getElementById('nav-auth');
    if (!slot) return;
    var T = window.M2R.t;
    if (me) {
      var img = me.photoURL
        ? '<img src="' + window.M2R.esc(me.photoURL) + '" alt="" />' : '👤';
      slot.innerHTML =
        '<span class="auth-chip">' + img + '<span>' + window.M2R.esc(me.displayName) + '</span></span>' +
        '<a class="site-nav__link" href="profile.html">' + window.M2R.esc(T('nav.profile')) + '</a>' +
        (isAdmin() ? '<a class="site-nav__link" href="admin.html">' + window.M2R.esc(T('nav.admin')) + '</a>' : '') +
        '<a class="site-nav__link" href="#" id="nav-logout">' + window.M2R.esc(T('nav.logout')) + '</a>';
      var lo = document.getElementById('nav-logout');
      if (lo) lo.addEventListener('click', function (e) { e.preventDefault(); logout(); });
    } else {
      slot.innerHTML =
        '<a class="site-nav__link" href="login.html">' + window.M2R.esc(T('nav.login')) + '</a>' +
        '<a class="site-nav__link" href="signup.html">' + window.M2R.esc(T('nav.signup')) + '</a>';
    }
  }

  document.addEventListener('DOMContentLoaded', watch);

  window.M2RAuth = {
    current: current, currentUser: current,
    onAuth: onAuth,
    signup: signup, signUp: signup,
    login: login, signIn: login,
    logout: logout, signOut: logout,
    signOutToLogin: logout,
    isAdmin: isAdmin, requireAuth: requireAuth, requireAdmin: requireAdmin,
    redirectIfAuthed: redirectIfAuthed, refreshHeader: refreshHeader,
    getEnrolled: getEnrolled, setEnrolled: setEnrolled, addEnrollment: addEnrollment,
    getProgress: getProgress, saveProgress: saveProgress, pullCloud: pullCloud,
    errKey: errKey, ADMIN_EMAILS: ADMIN_EMAILS,
    me: function () { return me; }
  };
})();

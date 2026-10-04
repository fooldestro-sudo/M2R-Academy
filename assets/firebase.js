/* M2R-Academy Firebase layer (Spark plan: free, no card).
   Fill FIREBASE_CONFIG from Firebase Console, then everything lights up.
   Unconfigured or offline => every function fails soft (demo/local mode). */
(function () {
  'use strict';

  // Live config from Firebase Console (Project settings > Your apps > Web).
  // Project: m2r-academy. Spark plan (free, no card).
  // Note: measurementId omitted — Analytics SDK not loaded (keeps bundle lean, no tracking).
  var FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAoV7n3JIXUu2XeWWCESMWXPykneZMA-2I',
    authDomain: 'm2r-academy.firebaseapp.com',
    projectId: 'm2r-academy',
    storageBucket: 'm2r-academy.firebasestorage.app',
    messagingSenderId: '537816928545',
    appId: '1:537816928545:web:893c0918738f816d1eae60'
  };

  var app = null, auth = null, db = null, storage = null, loading = null;

  function configured() {
    return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var ok = false;
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { if (!ok) { ok = true; resolve(); } };
      s.onerror = function () { if (!ok) { ok = true; reject(new Error('load failed')); } };
      document.head.appendChild(s);
      setTimeout(function () { if (!ok) { ok = true; reject(new Error('load timeout')); } }, 15000);
    });
  }

  /**
   * Lazily load compat SDKs and init. Resolves with {auth, db, storage}.
   * @returns {Promise<{auth:any,db:any,storage:any}>}
   */
  function ready() {
    if (app) return Promise.resolve({ auth: auth, db: db, storage: storage });
    if (loading) return loading;
    loading = Promise.resolve()
      .then(function () {
        if (!configured()) throw new Error('firebase not configured');
        if (!window.navigator.onLine) throw new Error('offline');
        if (!window.firebase || !window.firebase.initializeApp) {
          var base = 'https://www.gstatic.com/firebasejs/10.12.0/';
          return loadScript(base + 'firebase-app-compat.js')
            .then(function () { return loadScript(base + 'firebase-auth-compat.js'); })
            .then(function () { return loadScript(base + 'firebase-firestore-compat.js'); })
            .then(function () { return loadScript(base + 'firebase-storage-compat.js'); });
        }
      })
      .then(function () {
        if (!app) {
          app = window.firebase.initializeApp(FIREBASE_CONFIG);
          auth = window.firebase.auth();
          db = window.firebase.firestore();
          storage = window.firebase.storage();
        }
        return { auth: auth, db: db, storage: storage };
      })
      .catch(function (err) { loading = null; throw err; });
    return loading;
  }

  window.M2RFirebase = { ready: ready, configured: configured };
})();

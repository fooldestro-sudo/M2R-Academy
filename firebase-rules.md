# Firebase Rules — M2R-Academy (`m2r-academy`)

Paste these in Firebase Console. Project uses Compat SDK `10.12.0`, no backend.

## How to apply

1. Go to Firebase Console → Firestore → Rules → paste Block 1 → Publish
2. Go to Firebase Console → Storage → Rules → paste Block 2 → Publish
3. Go to Authentication → Settings → Authorized domains → add `<your-username>.github.io`
4. Go to Authentication → Sign-in method → enable **Email/Password**

## Block 1 — Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || isWorker();
      allow delete: if isAdmin();
    }
    match /competitions/{compId} {
      allow read: if true;
      allow write: if isWorker();
    }
    match /submissions/{subId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if isWorker();
    }
    match /points_log/{logId} {
      allow read: if request.auth != null;
      allow write: if isWorker();
    }
    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /siteProjects/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    function isOwner() {
      return request.auth != null
        && request.auth.token.email.lower() == 'darkstorm885@gmail.com';
    }
    function isWorker() {
      return isOwner() || (request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['worker', 'admin']);
    }
    function isAdmin() {
      return isOwner() || (request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

> Note: `siteProjects` added to match current `admin.js`/`projects.html` implementation.
> Owner `darkstorm885@gmail.com` is hardcoded as `isOwner()` in rules, so
> Mustafa is admin from signup alone — no manual `role` edit needed.
> `ADMIN_EMAILS` in `assets/auth.js` is the UI gate; `isOwner()` is the
> server enforcement. Other admins still use `role == 'admin'`.

## Block 2 — Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    match /profile-pictures/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

> Second match covers `profile-pictures/{uid}/avatar` path used in `assets/profile.js`.

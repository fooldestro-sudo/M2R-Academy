# M2R-Academy — Static Learning Platform

Arabic-first multi-page academy (Programming, Web, Chess + Cybersecurity soon).
Vanilla HTML + CSS + JS. No backend code, no build step, no npm — push to
`main` and GitHub Pages redeploys. Optional Firebase (free Spark) powers
accounts, leaderboard, and admin.

> Live: `https://<username>.github.io/M2R-Academy/`

## Folder structure

```
├── index.html about.html courses.html track.html enroll.html watch.html
├── projects.html contact.html login.html signup.html profile.html
├── leaderboard.html admin.html 404.html
├── assets/ styles.css site.js firebase.js auth.js profile.js
│          leaderboard.js admin.js player.js logo.svg founders/
├── data/ courses.json projects.json settings.json
└── README.md M2R-Spec.md target001.md
```

## Firebase Setup (live — `m2r-academy`)

1. **Where `firebase.js` lives:** `assets/firebase.js` holds `FIREBASE_CONFIG`
   (already filled for `m2r-academy`) + lazy Compat loader (`10.12.0`).
   Pages load `site.js → firebase.js → auth.js`; SDKs load on demand only
   when `apiKey+projectId` are set and online. No `import`, no bundler.
2. **Admin owner (done):** `assets/auth.js:7` —
   `var ADMIN_EMAILS = ['darkstorm885@gmail.com']`. Server enforcement is
   `isOwner()` in `firebase-rules.md` (no manual `role` edit needed).
3. **Where to paste Security Rules:** full copy-paste file is `firebase-rules.md`
   in repo root. Firestore → Rules → paste Block 1 → Publish. Storage → Rules
   → paste Block 2 → Publish.
4. **How to add the GitHub Pages domain:** Firebase Console → Authentication →
   Settings → Authorized domains → Add `fooldestro-sudo.github.io`
   (plus `localhost` for local testing).
5. **How to test signup/login locally:**
   `python3 -m http.server 8000` → `http://localhost:8000/signup.html` →
   create account → check Firestore `users/{uid}` → `login.html` →
   `profile.html` (avatar 2MB max) → `leaderboard.html` → `admin.html`
   (admin email only). Offline/unconfigured still works for enroll/watch via
   `eduportal.enrolled` localStorage.

## Firebase setup (free, optional but needed for accounts) — legacy checklist

1. **console.firebase.google.com** → project `m2r-academy` (already created).
2. **Authentication** → Get started → enable **Email/Password**.
3. **Firestore Database** → Create database → Start in test mode (then paste
   production rules from `firebase-rules.md`).
4. **Storage** → Get started (then paste Storage rules).
5. Config already in `FIREBASE_CONFIG` in `assets/firebase.js`; admin email in
   `ADMIN_EMAILS` in `assets/auth.js`. Push — live in ~1 minute.

Without config, the site runs fully except account features
(signup/login/board/admin show friendly messages).

## Deploy to GitHub Pages

Repo Settings → Pages → Source: `main` branch, `/` (root). Done — no build.

## Add a project to `projects.json`

Append `{title, titleEn, student, studentEn, track, image, description,
descriptionEn, link}` to the `projects` array. `image: ""` renders a
placeholder. Admins can also add projects from `admin.html` (stored in
Firestore `siteProjects`, merged in automatically).

## Enroll flow

Track page → part → `enroll.html?course=<partId>` shows an 8-char code
(track prefix + 7 hex). The user sends it on WhatsApp
(`wa.me/201094578070`, message prefilled) and pastes back the reversed code.
Unlocks persist per device (`eduportal.enrolled`) and sync to Firestore
`users/{uid}.enrolledCourses` when logged in.

## Notes

- Course YouTube IDs are verified embeddable — do not swap blindly.
- Founder photos live in `assets/founders/` (SVG placeholders now).
- `data/settings.json` is the offline fallback; live announcements come from
  Firestore `settings/main` when configured.

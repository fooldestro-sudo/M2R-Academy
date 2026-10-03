# target001 — M2R-Academy target + full build record

> Owner-approved target. Amends `M2R-Spec.md` §13: Firebase is allowed
> **only** for accounts, leaderboard, and admin (site stays static on Pages).

## 1. Target: what the user finds on the website

1. **Portfolio** — academy/student work showcase (hero-adjacent gallery).
2. **About** — academy story + **Founders, each with name, picture, and role**
   (Mustafa — Founder; Malak — role TBA; Rahma — role TBA) + **motivational words**.
3. **Courses** — the 3 tracks (Programming, Web, Chess), parts, enroll, player.
4. **Competition leaderboard** — live ranks from user points (see §3).
5. **Contact** — founder WhatsApp (+201094578070, prefilled chat link) + channels.
6. **Footer** — links, tracks, credited sources, disclaimer, copyright.

## 2. Account & data decisions (owner-ordered)

- **Remove ALL demo accounts**: delete `data/users.json`, `secrets/cred.txt`
  (repo copy + local `Desktop/secrets`), demo login paths, demo-mode fallbacks.
- **Set Firebase** (Spark plan: free, no card): Email/Password Auth + Firestore.
- **Admin account**: Mustafa's email allow-listed in code. Admin can: see all
  users, add/remove points, soft-ban users, edit settings/content (announcements,
  projects). Hard account deletion stays a Firebase-console job (not possible
  from a static page).
- **Competition**: `points` (number) on each user doc; leaderboard page queries
  ordered by points desc; each user sees their rank vs others; ties share rank.
- **Clean code, great structure**: vanilla files only; BEM-lite CSS; one section
  per concern in JS; design tokens on `:root`; JSDoc on non-obvious functions;
  zero globals except guarded API hooks; no `console.log` shipped.

## 3. Resulting file map (target)

```
M2R-Academy/
├── index.html        # hero, portfolio preview, tracks preview, leaderboard preview
├── about.html        # story, founders (photo+name+role), motivational words, FAQ
├── courses.html      # 3 tracks grid
├── track.html        # parts list (?track=)
├── enroll.html       # WhatsApp handshake unlock (?course=)
├── watch.html        # protected player (?course=)
├── leaderboard.html  # live ranks from Firestore
├── projects.html     # portfolio / student showcase
├── contact.html      # founder WhatsApp + channels
├── 404.html
├── assets/           # styles.css, site.js, player.js, logo.svg, founders/
├── data/             # courses.json, projects.json, settings.json (admin-edited)
└── *.md              # README, M2R-Spec, changes001, details001, target001
```

## 4. All builds and changes done (record)

1. EduPortal vanilla SPA (5 screens, OTP reverse-code, custom YT player) → `Desktop/OAW`.
2. 6-track Egyptian expansion (124+ videos, verified IDs), 8-hex track-prefixed
   OTP (C/P/E/S/T/W), anti-leak player, 100 demo users + `secrets/cred.txt`.
3. Pushed to public GitHub `fooldestro-sudo/OAW-Academy` (owner insisted public
   incl. secrets; private recommended) → GitHub Pages live + verified.
4. Enroll hint → "Contact your Appline…" (owner wording).
5. Removed Cybersecurity + English → 4 tracks / 124 videos.
6. HD 720p → lag diagnosed via real-browser embed test (all 12 trading READY) →
   adaptive-friendly HD + quality picker (Auto/720p/480p/360p).
7. Per-user data isolation (`eduportal.*.<username>`) + legacy migration (33 checks).
8. Firebase Spark email accounts + sign-up screen + Firestore sync (15 checks,
   demo fallback until keys pasted — keys never arrived).
9. Rebrand OAW → **M2R-Academy** (storage keys preserved); `M2R-Spec.md` written
   (corrected) + pushed; repo + folders renamed; backup kept at
   `Documents/M2R-Academy`.
10. **This file**: target locked — portfolio/about/courses/leaderboard/contact/
    footer; demo accounts slated for deletion; Firebase set; admin + competition;
    clean-code structure above.
11. Removed Limitless Organization (trading track retired) → 3 tracks / 112 videos;
    Udemy added as a credited content source.

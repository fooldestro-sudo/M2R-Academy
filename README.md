# OAW Academy — Static Front-End Learning Platform

A 100% client-side single-page app (vanilla HTML + CSS + JS). No backend, no build step, no npm.
Open `index.html` directly via `file://` or serve it from any static host.

> **Security note:** this is a UI prototype with **no real security**.
> Credentials live in plain text, enrollment is a `localStorage` flag, and the
> OTP is just the displayed code reversed. Do not use this pattern for real,
> private, or paid content.

## Quick start

1. Double-click `index.html` — it just works (data falls back to the embedded
   `<script type="application/json">` blocks when `fetch` is blocked on `file://`).
2. Or serve statically, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000`.
3. Sign in with your account (see `../secrets/cred.txt` for the 100 shipped accounts),
   pick one of the **4 tracks**, open a part, enroll with the reversed-code OTP, and watch.
   `Create account` gives a real email account once the free Firebase setup below is done.

## The 4 tracks

| # | Track | Code prefix | Content (all Egyptian Arabic) |
|---|-------|-------------|-------------------------------|
| 1 | 💻 Programming | `P` | Choice of C++ (Elzero, 14 lessons) or Python (Elzero, 14 lessons) |
| 2 | 🌐 Web Development | `W` | HTML (10) + CSS (10) + JavaScript (10) + TypeScript (8) + React (7) — Elzero / codeZone / Codezilla |
| 3 | ♞ Chess | `C` | Takkat Chess — Beginner Soviet school (17) + Intermediate endings & rating (12) + Advanced Woodpecker & Reassess (10) |
| 4 | 📈 Trading | `T` | Limitless Organization classic course Part 1 (12 lessons, oldest→newest) + Part 1.1 (coming soon) |

Tracks with two choices (Programming, Trading) first show a parts list; each part
enrolls and plays independently.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All 5 screens + embedded JSON fallback |
| `style.css` | Design system (tokens on `:root`), layout, responsive rules |
| `app.js` | All logic: Bootstrap, Router, Auth, Tracks, Detail, Enroll, Player, Controls, Progress, Utils |
| `data/users.json` | 100 users (must match `../secrets/cred.txt`) |
| `data/courses.json` | 6 courses across the 4 tracks |

## Real accounts (free, no money, stays on GitHub)

Out of the box the app runs in **demo mode** (100 built-in users, data in the
browser). For **real sign-up / sign-in with email + password** and data that
follows users across devices, plug in Firebase's free Spark plan
(free forever for this size, **no credit card asked**):

1. Go to **console.firebase.google.com** and sign in with any Google account.
2. **Add project** → name it e.g. `oaw-academy` → decline Gemini/AI help → Create.
3. Left menu → **Build → Authentication** → **Get started** → **Sign-in method** tab → enable **Email/Password** → Save.
4. Left menu → **Build → Firestore Database** → **Create database** → choose any
   location → **Start in test mode** → Enable. (Test mode is fine to start;
   tighten rules later from the Rules tab.)
5. Top-left ⚙️ → **Project settings** → scroll to **Your apps** → click **`</>` (Web)**
   → nickname `oaw` → **Register app** → copy the `firebaseConfig` values.
6. In this repo open **`app.js`**, find `FIREBASE_CONFIG` near the top, paste your
   four values (`apiKey`, `authDomain`, `projectId`, `appId`), then push —
   the live site picks it up in ~1 minute.

What changes once configured (nothing else to do):
- **Create account** on the login screen creates a real account (passwords are
  hashed by Google — the app never sees or stores them).
- Signing in with an `email` uses the real account; plain usernames keep using demo mode.
- Enrollments + progress sync to Firestore per user **and** stay in the browser,
  so offline still works and nothing is ever lost.
- Sessions survive refresh via Firebase; Log out signs out everywhere on the device.

Costs: Spark plan includes 50k monthly logins + 1 GiB database free. This app's
usage is a tiny fraction of that — the bill stays $0.

## Enrollment / OTP flow

1. The enroll screen shows a random **8-character hexadecimal code**.
   Its **first letter is fixed per track** — `P` programming,
   `W` web, `C` chess, `T` trading — so the Appline knows the track.
2. Copy it with **Copy** (uses `navigator.clipboard` with an `execCommand` fallback).
3. The OTP is the code **reversed** (e.g. `T3F9A1C4` → `4C1A9F3T`, case-insensitive).
4. Type it and press **Verify & Unlock course**. Wrong codes shake + clear;
   after 3 failures a fresh code is generated.

## Player (protected)

- Lazy-loads the YouTube IFrame API on first open with
  `controls:0, rel:0, modestbranding:1, disablekb:1, playsinline:1, iv_load_policy:3, fs:0, vq:hd720`.
- Quality defaults to **HD 720p** (`vq` + per-video `suggestedQuality` + re-assert on
  ready/cued — never during playback, so slow connections don't rebuffer in a loop).
  A **quality picker** (Auto / 720p / 480p / 360p) in the controls lets anyone on weak
  internet drop down for smooth playback; the choice is remembered on the device.
- A transparent shield owns every pointer gesture and right-click/drag are
  blocked, so viewers can never reach YouTube chrome, external links, or
  downloads — playback stays inside OAW Academy with an on-screen watermark.
- Custom controls only: prev / play / next, seek bar (250 ms tick), time,
  mute + volume, speed (0.5–2×), fullscreen (wraps the stage, not the frame).
- Shortcuts (player screen, not while typing): `Space/K` play, `←/→` ±5s,
  `↑/↓` volume, `M` mute, `F` fullscreen, `N` next, `P` previous.
- Playlist is grouped by level sections; progress (`videoIndex` + `seconds`)
  autosaves ≤ every 5 s, plus on pause / ended / page unload, and restores on open.

## How to edit `data/users.json`

```json
{ "users": [{ "username": "mostafa", "password": "mostafa343", "displayName": "Mostafa" }] }
```

- `username`: matched case-insensitively, trimmed on login.
- `password`: matched exactly — case-sensitive, never trimmed.
- `displayName`: shown in the topbar; falls back to `username`.
- Keep `../secrets/cred.txt` in sync (`username:password` per line).
- Mirror the same JSON into `<script type="application/json" id="users-data">`
  in `index.html` for `file://` support.

## How to edit `data/courses.json`

```json
{
  "courses": [{
    "id": "trading-part1", "track": "trading", "trackPrefix": "T",
    "title": "...", "about": "...",
    "thumbnail": "https://img.youtube.com/vi/<ID>/maxresdefault.jpg",
    "totalTime": "11h 35m", "source": "Channel name",
    "videos": [{ "id": "v1", "title": "...", "youtubeId": "...", "duration": "10:00", "section": "optional group" }]
  }]
}
```

- `track` groups courses into the 6 tracks; `trackPrefix` is the OTP first letter.
- `"comingSoon": true` with `"videos": []` renders a disabled Coming-soon part.
- Mirror into `<script type="application/json" id="courses-data">` in `index.html`.

## localStorage keys

| Key | Shape | Written by | Cleared by |
|-----|-------|-----------|-----------|
| `eduportal.session` | `{"username":"...","displayName":"..."}` | login | logout |
| `eduportal.enrolled.<username>` | `["trading-part1"]` | OTP verify | manual only |
| `eduportal.progress.<username>` | `{"chess":{"videoIndex":2,"seconds":143}}` | player | manual only |

Every account has its own enrollments and progress (suffixed with the
lowercased username), so users sharing one device never see each other's data.
A leftover pre-fix global key is migrated to the current user once, then removed.

All reads are `try/catch`-guarded; corrupted or disabled storage never crashes the app.

## Layout & accessibility

- Tracks grid: 3 cols ≥1024px, 2 cols ≥640px, 1 col below. Max width 1200px.
- Playlist is a sticky sidebar on desktop, stacked below the video under 1024px.
- Dark indigo theme, system fonts, `:focus-visible` rings, `aria-live` errors/toasts,
  `dir="auto"` on Arabic titles, and `prefers-reduced-motion` support. Tap targets ≥ 44px.

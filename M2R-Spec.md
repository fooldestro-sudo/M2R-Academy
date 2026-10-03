# M2R-Academy — Full Build Specification

> **Purpose:** Hand this file to OpenCode to build the entire project from scratch or complete with changes
> **Project name:** M2R-Academy
> **Guiding rule:** No backend, no build step, no extra tools — plain files on GitHub Pages.
> **Language:** Arabic (RTL) primary, English toggle available. (UI text will be in Arabic, but this spec is written in English.)

---

## 1. Academy Identity

- **Name:** M2R-Academy
- **Founders:** Mustafa, Malak, Rahma (initials: M2R)
- **Tagline:** "Learn. Practice. Master."
- **Mission:** Provide high-quality programming and chess courses in Arabic, free and accessible.
- **Target audience:** Arabic-speaking learners in Egypt and the Middle East.
- **Founder contact (WhatsApp):** +201094578070 → `https://wa.me/201094578070`
- **Source channels (credited in footer):** Elzero Web School, codeZone, Codezilla, Takkat Chess, Udemy.

---

## 2. Tech Stack (STRICT)

| Layer | Choice | Forbidden |
| :--- | :--- | :--- |
| **HTML** | Vanilla HTML5, multi-page | SPA |
| **CSS** | Vanilla CSS3 (custom properties) | Tailwind, Bootstrap |
| **JS** | Vanilla ES6+ (no modules, no bundler) | React, Vue, TypeScript-compiled |
| **Data** | JSON files loaded via `fetch()` with inline-JSON fallback for `file://` | Backend, databases |
| **Fonts** | Google Fonts (Cairo for Arabic, Inter for English) with system-font fallback | — |
| **Build** | None — files pushed directly to GitHub Pages | Webpack, Vite, npm build |
| **Hosting** | GitHub Pages (branch: `main`, folder: `/`) | Netlify, Vercel |

**No build step. No `node_modules`. No `package.json` needed.**

---

## 3. File Structure

```
M2R-Academy/
├── index.html              # Landing page
├── about.html              # About + FAQ
├── courses.html            # 4 track cards grid
├── track.html              # Track detail (query: ?track=<id>)
├── enroll.html             # OTP unlock (query: ?course=<id>)
├── watch.html              # Protected player (query: ?course=<id>)
├── projects.html           # Student showcase
├── contact.html            # Founder contact + WhatsApp
├── 404.html                # Custom not-found
├── assets/
│   ├── styles.css          # All styles (shared)
│   ├── site.js             # Header/nav/footer injection + i18n
│   ├── player.js           # Video player logic (only in watch.html)
│   └── logo.svg            # M2R logo (inline SVG preferred over PNG)
├── data/
│   ├── courses.json        # Full course catalogue (4 tracks)
│   └── projects.json       # Student projects
├── README.md               # Project readme
└── M2R-Spec.md             # This file
```

---

## 4. Design System

### Colors (CSS Variables in `:root`)
```css
--bg-primary: #0f0f23;      /* Deep dark indigo */
--bg-secondary: #1a1a35;    /* Slightly lighter */
--bg-card: #1e1e3f;         /* Cards */
--accent: #6366f1;          /* Indigo accent */
--accent-hover: #818cf8;    /* Lighter indigo */
--text-primary: #e2e8f0;    /* Light gray */
--text-secondary: #94a3b8;  /* Muted */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
--border: #2d2d52;
```

### Typography
- **Arabic font:** Cairo (Google Fonts, `display=swap`, system fallback)
- **English font:** Inter (Google Fonts, `display=swap`, system fallback)
- **Headings:** Bold, 700
- **Body:** Regular, 400, 16px
- **Line height:** 1.7 for Arabic

### Layout
- Max width: 1200px
- Responsive breakpoints: 768px, 1024px (single column below 640px)
- RTL by default (`<html dir="rtl" lang="ar">`)
- Dark theme only (no light mode)

---

## 5. Shared Chrome (Header / Nav / Footer)

### Injected via `assets/site.js`
Every page includes:
```html
<div id="site-header"></div>
<main>...</main>
<div id="site-footer"></div>
```

`site.js` injects the same header + footer into every page.

### Header Content (English names for spec; actual UI text will be Arabic)
- Logo (left in RTL = right visually)
- Nav links: Home | About | Courses | Projects | Contact
- Language toggle button (AR / EN)
- Mobile hamburger menu

### Footer Content
- **Column 1:** About M2R-Academy (2 lines)
- **Column 2:** Quick links (all pages)
- **Column 3:** 4 Tracks list
- **Column 4:** Source channels (credited)
- **Bottom bar:** Copyright © 2025 M2R-Academy | Disclaimer

---

## 6. Pages Specification

### `index.html` — Landing
Sections (in order):
1. **Hero:** Academy name + tagline + CTA button "Start Learning"
2. **What is M2R-Academy:** 2-3 sentences
3. **Our Target:** 3 bullet points
4. **Tracks Preview:** 3 cards (Programming, Web, Chess) + Cybersec (SOON) card
5. **Projects Preview:** 3 latest student projects
6. **How it Works:** 3 steps (Choose course → Get Appline code → Unlock & learn)
7. **Footer**

### `about.html` — About
1. Hero: "About Us"
2. Academy story (founding by Mustafa, Malak, Rahma)
3. Mission & Vision
4. Learning method (self-paced, Appline unlock, no accounts)
5. FAQ (5-7 questions)
6. Footer

### `courses.html` — Courses
- Grid of 4 track cards
- Each card: icon, title, short description, "Explore" button → `track.html?track=<id>`

### `track.html` — Track Detail
- Query param: `?track=<id>` (ids: `programming`, `web`, `chess`)
- Hero with track name + description
- List of parts/sections
- Each part: title, video count, "Get Code" button → `enroll.html?course=<courseId>`
- Coming-soon parts render disabled, never link to enroll

### `enroll.html` — OTP Unlock
- Query param: `?course=<courseId>`
- Display: "Contact your Appline and enter the OTP code it gives you."
- Input field: 8-char code
- Verify logic (see §8 — reverse of the shown code, no stored list)
- On success → save to localStorage `eduportal.enrolled`, redirect to `watch.html?course=<id>`
- On failure → show error message
- Per-device unlock (no server)

### `watch.html` — Protected Player
- Query param: `?course=<courseId>`
- Check localStorage: if not enrolled → redirect to `enroll.html`
- YouTube embed with:
  - `controls: 0` (custom controls)
  - `modestbranding: 1`
  - `rel: 0`
  - `disablekb: 1`
  - `vq: 'hd720'` + per-video `suggestedQuality` (720p default, adaptive respected)
- Custom controls: play/pause, seek, volume, quality picker (Auto/720p/480p/360p)
- Watermark overlay: "M2R Academy • Protected"
- Click shield (prevent right-click, drag, and any iframe interaction)
- Sectioned playlist sidebar (list of videos in the track)
- Progress saved to `localStorage.eduportal.progress`

### `projects.html` — Student Showcase
- Grid of project cards from `data/projects.json`
- Each card: image, title, student name, track, description, link (optional)
- Filter by track (optional)

### `contact.html` — Contact
- Founder card (Mustafa) with WhatsApp button:
  `https://wa.me/201094578070?text=Hello%20M2R-Academy%2C%20I%27m%20a%20student%20and%20I%20need%20help%20with%3A%20`
- Source channels list

### `404.html` — Not Found
- Custom design matching the theme
- "Page Not Found" + link back to home

---

## 7. Data Structures

### `data/courses.json`
Reshape the existing verified catalogue (3 tracks, 112 videos) into:
```json
{
  "tracks": [
    {
      "id": "programming",
      "title": "Programming",
      "titleEn": "Programming",
      "trackPrefix": "P",
      "icon": "code",
      "description": "Learn C++ and Python from zero to professional",
      "parts": [
        {
          "id": "programming-cpp",
          "title": "C++",
          "comingSoon": false,
          "videos": [
            { "id": "v1", "title": "Introduction", "youtubeId": "yt_video_id", "duration": "10:50" }
          ]
        }
      ]
    }
  ]
}
```

**3 Tracks (prefix is an explicit field, never derived from the id):**
- `programming` — C++ / Python (prefix: **P**)
- `web` — HTML → CSS → JS → TS → React (prefix: **W**)
- `chess` — Takkat Chess playlist (prefix: **C**)

**Total: 112 videos across 3 tracks.** All YouTube IDs already verified as embeddable — reuse them, do not re-research.
A 4th card, **Cybersec (SOON)** (`cybersecurity`, empty, `comingSoon: true`), renders
disabled until its content ships.

### `data/projects.json`
```json
{
  "projects": [
    {
      "title": "Project Name",
      "student": "Student Name",
      "track": "web",
      "image": "assets/projects/proj1.png",
      "description": "Short description",
      "link": "https://..."
    }
  ]
}
```

### `file://` support
`fetch()` of local JSON is blocked on `file://`. Mirror each JSON file inside its
pages as `<script type="application/json">` fallback blocks (same pattern as the
previous build): try `fetch()` first, fall back to inline data.

---

## 8. OTP Unlock Logic (`enroll.html`)

```javascript
// The page shows a random code, e.g. "C7B2E9A1".
// First char = track prefix (P/W/C) + 7 random hex chars (0-9, A-F).
// The user types its REVERSE. There is NO stored list of valid codes.
function verifyOTP(input, displayedCode) {
  const norm = input.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (norm.length < 8) return 'Please enter the 8-character code.';
  return norm === displayedCode.split('').reverse().join('').toUpperCase();
}
```

On success:
```javascript
const enrolled = JSON.parse(localStorage.getItem('eduportal.enrolled') || '[]');
if (!enrolled.includes(courseId)) {
  enrolled.push(courseId);
  localStorage.setItem('eduportal.enrolled', JSON.stringify(enrolled));
}
window.location.href = `watch.html?course=${courseId}`;
```

---

## 9. Bilingual System (AR / EN)

- Default: Arabic (`<html dir="rtl" lang="ar">`)
- Language toggle button in header switches to English
- Storage: `localStorage.getItem('m2r.lang')` (values: `ar` | `en`)
- Implementation: `data-i18n="key"` attributes on text elements
- Dictionary in `assets/site.js`:
```javascript
const i18n = {
  ar: {
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.courses": "الكورسات",
    // ... (Arabic UI strings)
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.courses": "Courses",
    // ... (English UI strings)
  }
};
```
- On toggle: change `document.dir`, `document.lang`, and swap all `[data-i18n]` text.
- **Course content stays in Egyptian Arabic** regardless of UI language (stated on-site).

---

## 10. Player Requirements (`watch.html`)

- YouTube iframe API
- Custom controls (no YouTube controls)
- Quality picker: Auto, 720p, 480p, 360p (720p default; never force quality during playback)
- Sectioned playlist sidebar
- Progress bar (saved to localStorage)
- Keyboard shortcuts: Space (play/pause), ← → (seek 5s), ↑ ↓ (volume)
- Anti-leak:
  - Right-click disabled
  - Drag disabled
  - `pointer-events: none` on the iframe + transparent click shield
  - Watermark overlay ("M2R Academy • Protected")

---

## 11. Quality Gates

Before marking the project as done, verify:

- [ ] Zero console errors on all pages
- [ ] All links work (no 404s)
- [ ] Responsive on desktop (1920px) + mobile (390px)
- [ ] RTL layout correct in Arabic, LTR correct in English
- [ ] Language toggle persists after reload
- [ ] OTP unlock flow works (correct code → unlock; wrong code → error)
- [ ] Player plays, seeks, changes quality, tracks progress
- [ ] Enrolled courses persist after browser restart
- [ ] 404 page shows for non-existent routes
- [ ] Footer appears on every page
- [ ] Header nav works on all pages

---

## 12. Deploy to GitHub Pages

1. Repo `M2R-Academy` (public) on GitHub.
2. Push all files to `main` branch.
3. Settings → Pages → Source: `main` branch, `/` (root).
4. Site live at: `https://<username>.github.io/M2R-Academy/`
5. No build step required.

---

## 13. What NOT to Do

- ❌ No `package.json`, no `node_modules`
- ❌ No React, Vue, Angular, Svelte
- ❌ No Tailwind, Bootstrap, or any CSS framework
- ❌ No TypeScript compilation
- ❌ No backend, no Firebase, no database
- ❌ No login, sign-up, or user accounts
- ❌ No SPA (must be multi-page)
- ❌ No external build tools (Webpack, Vite, Rollup)

---

## 14. Build Order (Recommended)

1. `assets/styles.css` — design system first
2. `assets/site.js` — header/footer injection + i18n
3. `data/courses.json` — reshape existing 3 tracks, 112 videos
4. `data/projects.json` — sample 3-5 projects
5. `index.html` — landing
6. `courses.html` — tracks grid
7. `track.html` — track detail
8. `enroll.html` — OTP unlock
9. `watch.html` + `assets/player.js` — protected player
10. `about.html` — about + FAQ
11. `projects.html` — showcase
12. `contact.html` — founder contact
13. `404.html` — not found
14. `README.md` — documentation
15. Push to GitHub → enable Pages

---

## 15. Final Deliverable

A complete, working, multi-page static website hosted on GitHub Pages, with:
- 9 HTML pages
- 1 shared CSS file
- 2 shared JS files
- 2 JSON data files
- 1 logo (SVG)
- Arabic-first with English toggle
- No accounts, no backend, no build step

**Ready to be handed to OpenCode for execution.**

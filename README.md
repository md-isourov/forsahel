# In Loving Memory — Family Support Website

A small, static website for a group of friends who send monthly support to
the family of a friend who passed away. It has three pages:

- **Home** — a memorial page with a cover photo and three summary numbers
  (given this month, last given, total given).
- **Contributions** — a public list of donors and whether they're up to
  date, plus a private lookup where a donor can enter their **Donor ID**
  and see their own contribution history.
- **Gallery** — a photo gallery with a full-screen lightbox.

There is **no server and no database**. Every number on the site is
calculated in the browser from one file: `data/data.json`. To update the
site, you edit that file (or generate it from Google Sheets — see below)
and re-publish.

---

## 1. How the site works, in plain terms

- All content — the deceased's name and message, the list of donors, every
  month's contribution, and every payment given to the family — lives in
  `data/data.json`.
- The three HTML pages (`index.html`, `contributions.html`,
  `gallery.html`) are just templates. JavaScript in `js/` reads
  `data.json` when the page loads and fills in the numbers, tables, and
  photos.
- Because everything happens in the visitor's browser, the site can be
  hosted completely free on GitHub Pages — there's nothing to run, deploy,
  or pay for on a server.
- The site is **read-only for visitors**. There is no way to edit data
  from the website itself; you always edit `data.json` and publish an
  update.

### Important: the Donor ID is not a password

The Donor ID is a simple privacy mechanism, **not real authentication**.
Because this is a static website with no login system, anyone who knows or
guesses a Donor ID could type it in and see that donor's contribution
history. It exists only to stop a casual visitor from browsing everyone's
detailed numbers — it is **not encryption and not secure access control**.
Don't use it to protect anything more sensitive than "which months did I
contribute."

---

## 2. Editing `data/data.json`

Open `data/data.json` in any text editor (or Google Sheets, see section 3).
It has four parts:

### `meta`
```json
"meta": {
  "startMonth": "2025-06",     // the first month the initiative began
  "currentMonth": "2026-09",   // update this every month
  "currency": "BDT",
  "currencySymbol": "৳"
}
```
**`currentMonth` is the one field you must update every month.** It
controls which months count as "due" — nothing before `startMonth` and
nothing after `currentMonth` is ever counted, and `currentMonth` itself is
never marked as due (the month isn't over yet).

### `site.deceased`
The memorial content shown on the home page — name (English and Bangla),
dates, cover photo path, memorial message, and the short purpose
statement, each with an `en` and `bn` version.

### `donors`
An array, one entry per donor:
```json
{
  "id": "D001",
  "name": "Rafiq Ahmed",
  "expectedAmount": 2000,
  "contributions": {
    "2026-01": 2000,
    "2026-02": 2000
  }
}
```

- **`id`** — the Donor ID you give that person privately (e.g. by
  WhatsApp). Keep IDs short and hard to guess in sequence if you want
  slightly more privacy (e.g. random 4–6 character codes instead of
  `D001`, `D002`...).
- **`name`** — shown publicly.
- **`expectedAmount`** — their usual monthly amount. Currently shown for
  your own reference; the due-month logic only checks whether *any*
  amount was recorded for a month, so it supports donors who occasionally
  give a different amount.
- **`contributions`** — one key per month they contributed
  (`"YYYY-MM": amount`). **Leave a month out entirely if they didn't
  contribute that month** — don't add `"2026-03": 0`, just omit `"2026-03"`.

### `familyPayments`
An array of the actual payments given to the family — separate from what
donors gave in, since the two totals aren't always equal:
```json
{ "date": "2026-09-05", "amount": 13500, "note": "" }
```
The home page adds these up automatically for "Given this month", "Last
given", and "Total given."

### `gallery`
An array of photos:
```json
{ "src": "images/gallery-07.jpg", "caption": { "en": "...", "bn": "..." } }
```

---

## 3. Common editing tasks

**Add a donor**
Add a new object to the `donors` array with a unique `id`, their `name`,
and an empty `contributions: {}`.

**Record a monthly contribution**
Add `"YYYY-MM": amount` to that donor's `contributions` object.

**Mark a month as due**
You don't mark it — just don't add that month to `contributions`. Any
past month with no entry is automatically shown as due.

**Record money given to the family**
Add a new `{ "date": "YYYY-MM-DD", "amount": ..., "note": "" }` object to
`familyPayments`.

**Add gallery photos**
1. Add the image file to `images/` (e.g. `images/gallery-07.jpg`).
2. Add an entry to the `gallery` array in `data.json` with its path and
   caption.

**Change the deceased person's name, dates, or memorial message**
Edit `site.deceased` in `data.json`. Provide both `en` (English) and, for
the name and messages, `bn` (Bangla) text.

**Change any other text on the site (buttons, labels, headings)**
Open `js/i18n.js`. Every visible phrase is a key in the `TRANSLATIONS`
object, once under `en` and once under `bn`. Edit the value; the key
itself should not be changed since the HTML refers to it.

**Replace the cover photo or a gallery photo**
Just overwrite the file in `images/` with the same filename, or update the
`src` path in `data.json` if you rename it.

---

## 4. Updating the website from Google Sheets

Keep one spreadsheet with (at minimum) two tabs:

**Tab 1: `Contributions`** — one row per donor per month:

| Donor ID | Donor Name | Month   | Amount |
|----------|------------|---------|-------:|
| D001     | Rafiq Ahmed| 2026-09 | 2000   |

Only add a row when a contribution was actually made — leave the month out
if someone didn't pay, rather than adding a row with `0`.

**Tab 2: `Family Payments`** — one row per payment to the family:

| Date       | Amount | Note |
|------------|-------:|------|
| 2026-09-05 | 13500  |      |

### Simplest workflow (no scripting)
1. Update the spreadsheet as usual through the month.
2. At the start of each month, open `data/data.json` and manually add the
   new `"YYYY-MM": amount` entries for each donor from Tab 1, and a new
   `familyPayments` entry from Tab 2.
3. Update `meta.currentMonth`.
4. Commit and push (see deployment below).

This is the recommended approach for now: it takes a few minutes a month
and keeps the data file as the single source of truth, with no extra
tooling to maintain.

### Why not a live Google Sheets connection?
A live connection would need the sheet to be publicly readable (a privacy
risk, since it would include every donor's exact monthly amounts) and adds
a moving part that can break silently. A manual or scripted export keeps
the private data out of any public API and keeps the site simple and
static.

### If you want to automate it later
Because Tab 1 is already in "one row per donor per month" form, a short
script (Python or Google Apps Script) can later read the sheet (via the
Sheets API or a CSV export) and regenerate `data/data.json` automatically
— group rows by donor, nest them under `contributions`, and write the
file. The current JSON structure was chosen specifically so this kind of
script stays simple to write when you're ready for it. CSV is the easiest
export format to start from; JSON is what the website itself needs, so
the script's only job is CSV → JSON.

---

## 5. Running the site locally

Because the site loads `data.json` with `fetch()`, opening `index.html`
directly from your file system (`file://`) will usually be blocked by the
browser. Serve the folder locally instead:

```bash
cd memorial-site
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## 6. Deploying to GitHub Pages (free)

1. Create a new **public** GitHub repository (private repos need GitHub
   Pro for Pages, so use public unless you already have that).
2. Push this folder's contents to the repository root:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
5. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

There is no build step — the site is plain HTML/CSS/JS, so whatever is in
the repository is exactly what gets served.

### Updating the live site after changing `data.json`
```bash
git add data/data.json
git commit -m "Update September contributions"
git push
```
GitHub Pages redeploys automatically within a minute or two of the push.

### Optional custom domain
In **Settings → Pages → Custom domain**, enter your domain and follow
GitHub's DNS instructions. This is entirely optional — the default
`github.io` address works fine and costs nothing.

---

## 7. Project structure

```
memorial-site/
├── index.html            Home / memorial page
├── contributions.html    Public donor list + private lookup
├── gallery.html          Photo gallery
├── css/
│   └── style.css         All styling, incl. light/dark mode
├── js/
│   ├── i18n.js            English/Bangla text + language switching
│   ├── data.js            Loads data.json, all due-month calculations
│   ├── main.js             Shared UI behaviour (mobile menu, errors)
│   ├── home.js              Home page rendering
│   ├── contributions.js     Donor grid, lookup, dashboard
│   └── gallery.js           Gallery grid + lightbox
├── data/
│   └── data.json          All content and donation data — edit this
├── images/                 Cover photo, gallery photos, favicon
└── README.md
```

---

## 8. Notes on privacy and security

- Donor names and due-month status are intentionally public — that's the
  transparency the group wants.
- Nothing more detailed than name + due status is ever shown without a
  matching Donor ID.
- The Donor ID system does **not** provide real security (see section 1).
  Don't put phone numbers, addresses, bank details, or anything sensitive
  beyond contribution amounts into `data.json`.
- The whole site, including `data.json`, is publicly downloadable by
  anyone who visits (this is true of any static site). Only include
  information you're comfortable being technically reachable by a
  determined visitor who inspects the page source.

---

## 9. Placeholders to replace before launch

- `images/cover.jpg`, `images/gallery-01.jpg` … `gallery-06.jpg`,
  `images/favicon.png` — currently generated placeholder images.
- `site.deceased` fields in `data.json` (name, dates, message).
- Donor names and IDs in `data.json`.
- `familyPayments` and `contributions` sample data — replace with real
  figures, or clear them and start from your actual start month.

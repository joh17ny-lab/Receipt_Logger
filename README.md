# Receipt Logger

A serverless receipt-logging system for a small business. Snap a photo of a
receipt on your iPhone, answer a few quick questions, and the system saves the
image to Google Drive and appends a row to your Google Sheet — automatically
stamping the date.

```
 iPhone (iOS Shortcut)
   │  takes photo + asks: LLC, Description, Dining?, Amount
   │  POST JSON (+ base64 image)
   ▼
 Google Apps Script Web App  ──►  saves photo to Google Drive folder
   │                          ──►  appends row to Google Sheet
   ▼
 Google Sheet row: LLC | Date | Description | Dining | Amount | Image Link
```

No server to host, no monthly fee — everything runs on your Google account
plus the built-in iOS **Shortcuts** app.

---

## Repository layout

| Path | Purpose |
|------|---------|
| [`apps-script/Code.gs`](apps-script/Code.gs:1) | The Web App: receives data, saves the image, writes the row. |
| [`apps-script/appsscript.json`](apps-script/appsscript.json:1) | Apps Script manifest (scopes + web app config). |
| [`apps-script/config.sample.md`](apps-script/config.sample.md:1) | The Script Properties you must set. |
| [`apps-script/.clasp.json.example`](apps-script/.clasp.json.example:1) | Template for optional `clasp` CLI deployment. |
| [`ios-shortcut/SHORTCUT_SETUP.md`](ios-shortcut/SHORTCUT_SETUP.md:1) | Step-by-step iPhone Shortcut build guide. |
| [`receipt_logger.md`](receipt_logger.md:1) | Agent/spec description of the system. |

---

## Data captured

| Sheet column | Source | Notes |
|--------------|--------|-------|
| LLC | You choose | **Ohio**, **Indiana**, or **California** |
| Date | Automatic | Current date, `YYYY-MM-DD` |
| Description | You type | Free text |
| Dining | You choose | **Yes** or **No** |
| Amount | You type | Number |
| Image Link | Automatic | Shareable Google Drive link to the photo |

---

## Setup

### 1. Prepare Google Drive & Sheet
1. Create (or pick) a **Google Drive folder** for receipt photos and copy its
   **folder ID** from the URL.
2. Open your **Google Sheet** and copy its **Sheet ID** from the URL.
   This project targets:
   `https://docs.google.com/spreadsheets/d/1Wc8Dq2W4HJ7PDPcV1QaJfRPT_NMuNnVg-LDYF6sqkDY/edit`

### 2. Create the Apps Script project
You can do this in the browser (no tools) **or** with the `clasp` CLI.

**Option A — Browser (simplest)**
1. Go to <https://script.google.com> → **New project**.
2. Replace the default `Code.gs` contents with [`apps-script/Code.gs`](apps-script/Code.gs:1).
3. Create the manifest: Project Settings → enable *"Show appsscript.json"*, then
   paste [`apps-script/appsscript.json`](apps-script/appsscript.json:1).

**Option B — clasp CLI**
```bash
npm install -g @google/clasp
clasp login
cd apps-script
clasp create --type webapp --title "Receipt Logger"   # creates .clasp.json
clasp push
```

### 3. Configure secrets (Script Properties)
Open [`apps-script/Code.gs`](apps-script/Code.gs:1), edit the values inside the
`setup()` function (token, Sheet ID, folder ID), then **run `setup()` once** from
the editor. Approve the OAuth permissions when prompted. Afterwards, remove the
real values from `setup()` so they aren't kept in the file.

Then run **`ensureHeaders()`** once to write the header row if your sheet is empty.

See [`apps-script/config.sample.md`](apps-script/config.sample.md:1) for each
property and how to generate a strong `SECRET_TOKEN`.

### 4. Deploy the Web App
1. In the editor: **Deploy → New deployment → Web app**.
2. *Execute as:* **Me** · *Who has access:* **Anyone**.
3. Copy the **Web App URL** (ends in `/exec`).
4. Verify by opening that URL in a browser — you should see
   `{"ok":true,"service":"Receipt Logger","status":"running"}`.

### 5. Build the iPhone Shortcut
Follow [`ios-shortcut/SHORTCUT_SETUP.md`](ios-shortcut/SHORTCUT_SETUP.md:1),
pasting your **Web App URL** and **`SECRET_TOKEN`** where indicated.

---

## API contract

`POST <web app URL>` with `Content-Type: application/json`:

```json
{
  "token": "<SECRET_TOKEN>",
  "llc": "Ohio",
  "description": "Lunch with client",
  "dining": "Yes",
  "amount": "42.50",
  "imageBase64": "<base64 JPEG, optional>",
  "fileName": "receipt.jpg"
}
```

Success response:
```json
{
  "ok": true,
  "message": "Receipt logged.",
  "row": { "llc": "Ohio", "date": "2026-06-23", "description": "Lunch with client",
           "dining": "Yes", "amount": 42.5, "imageLink": "https://drive.google.com/..." },
  "_status": 200
}
```

Error responses set `"ok": false` and an `"error"` message (e.g. invalid token,
invalid LLC/Dining value, or server not configured).

---

## Security notes
- The `SECRET_TOKEN` is the only thing protecting the public Web App URL — keep
  it long and private, and never commit the real value.
- Saved images are set to **anyone-with-the-link can view** so the Sheet link
  works; the link is unguessable but not private. Adjust `setSharing` in
  [`apps-script/Code.gs`](apps-script/Code.gs:1) if you need stricter access.

## License
[MIT](LICENSE)

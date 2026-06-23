# Quickstart — Step by Step

This is the hands-on setup you do in your Google account and on your iPhone.
For full reference, see [`README.md`](README.md:1).

You'll collect three values along the way:
- **DRIVE_FOLDER_ID** (Part 1)
- **SECRET_TOKEN** (Part 2)
- **Web app URL** (Part 5)

---

## Part 1 — Create the Google Drive folder
1. Go to <https://drive.google.com>.
2. **+ New → New folder**, name it `Receipt Photos`, click **Create**.
3. Open the folder (double-click).
4. In the address bar the URL is
   `https://drive.google.com/drive/folders/`**`<DRIVE_FOLDER_ID>`**
5. Copy the code after `/folders/` — that's your **DRIVE_FOLDER_ID**.

## Part 2 — Generate a secret token
Open **Windows PowerShell** and run:
```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```
Copy the 64-character result — that's your **SECRET_TOKEN**.

## Part 3 — Create the Apps Script project
1. Go to <https://script.google.com> → **New project**.
2. In `Code.gs`, select all (Ctrl+A), delete, then paste the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs:1).
3. Click the **⚙️ Project Settings** → check
   **"Show 'appsscript.json' manifest file in editor"**.
4. Back in the **< > Editor**, open `appsscript.json`, replace its contents with
   [`apps-script/appsscript.json`](apps-script/appsscript.json:1).
5. **Save** (Ctrl+S). Name the project `Receipt Logger`.

## Part 4 — Enter settings and run setup
1. Open `Code.gs`, find the `setup()` function, and set:
   - `SECRET_TOKEN` → your token from Part 2
   - `SHEET_ID` → `1Wc8Dq2W4HJ7PDPcV1QaJfRPT_NMuNnVg-LDYF6sqkDY` (already filled)
   - `SHEET_NAME` → your sheet tab name (usually `Sheet1`)
   - `DRIVE_FOLDER_ID` → your folder ID from Part 1
2. **Save**.
3. In the function dropdown (top), select **`setup`** → click **▶ Run**.
4. Approve permissions: **Review permissions → pick account → Advanced →
   Go to Receipt Logger (unsafe) → Allow**.
5. Select **`ensureHeaders`** → **▶ Run** once (writes the header row).

## Part 5 — Deploy as a Web App
1. **Deploy → New deployment**.
2. Gear ⚙️ next to "Select type" → **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. **Deploy** → approve if prompted.
5. Copy the **Web app URL** (ends in `/exec`).
6. Test: open that URL in a browser → expect
   `{"ok":true,"service":"Receipt Logger","status":"running"}`.

## Part 6 — Build the iPhone Shortcut
Follow [`ios-shortcut/SHORTCUT_SETUP.md`](ios-shortcut/SHORTCUT_SETUP.md:1). Paste:
- your **SECRET_TOKEN** into the JSON text action (step 7),
- your **Web app URL** into the *Get Contents of URL* action (step 8).

Then run it: take a photo, answer LLC / Description / Dining? / Amount, and
confirm a new row appears in your Google Sheet with the image link in the last
column.

---

### Troubleshooting
- **`Unauthorized`** → token in the Shortcut doesn't match `SECRET_TOKEN`.
- **Blank Image Link** → check `DRIVE_FOLDER_ID` and that Base64 Encode used
  **Line Breaks: None**.
- **`Sheet tab ... not found`** → fix `SHEET_NAME` to match your tab exactly.

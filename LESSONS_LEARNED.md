# Lessons Learned — Receipt Logger Setup

A field log of every problem encountered while building and deploying this
system, the root cause, and the fix. Keep this for future reference when
building similar **iOS Shortcut → Google Apps Script Web App → Google Sheet/Drive**
integrations.

---

## 1. Git on a UNC / network path (`\\server\share\...`)

**Symptom:** `git init` succeeded but the next chained command failed with
`fatal: not in a git directory`, and `git ls-remote` returned empty.

**Root cause:** The repo lived on a UNC network path. Git refuses to treat such
directories as safe by default, and the work-tree check fails across `&&` chains.

**Fix:**
1. Run `git config --global --add safe.directory "%CD%"` (or the full UNC path).
2. Confirm with `git rev-parse --is-inside-work-tree` → should print `true`.
3. Then run `git init`, `git add`, `git commit`, etc. individually.

**Takeaway:** On network drives, always add `safe.directory` first.

---

## 2. `ensureHeaders()` crashed: `Cannot read properties of null (reading 'getRange')`

**Symptom:** Running `ensureHeaders()` threw a null error at the `getRange` line.

**Root cause:** `ss.getSheetByName(SHEET_NAME)` returned `null` because the
configured `SHEET_NAME` (`Sheet1`) did not match the actual tab name in the
spreadsheet.

**Fix:** Added a `getTargetSheet_(ss, sheetName)` helper that:
- tries the configured name first, and
- **falls back to the first tab** if the name isn't found.

Both `doPost` and `ensureHeaders` now use it, so a wrong `SHEET_NAME` no longer
crashes anything.

**Takeaway:** Never assume a sheet tab name. Look it up defensively and fall
back to `ss.getSheets()[0]`.

---

## 3. "Sorry, unable to open the file at this time" in a desktop browser

**Symptom:** Opening the `/exec` Web App URL in a normal desktop browser showed
this Google error page — even with access set to "Anyone".

**Root cause:** The desktop browser was signed into **multiple Google accounts**,
which confuses Apps Script web app routing. It was NOT a deployment problem.

**Fix / Diagnosis:**
- Test the `/exec` URL in **iPhone Safari** or a **desktop incognito window**
  (no logged-in account). It returned `{"ok":true,...}` there.
- The phone (where the Shortcut runs) is anonymous, so this is the environment
  that actually matters.

**Takeaway:** Anonymous web apps must be tested anonymously. A multi-account
desktop browser is a false-negative. Always verify in incognito / on the phone.

---

## 4. Web App access setting must be exactly "Anyone"

**Symptom:** Anonymous POSTs from the Shortcut failed / redirected to an HTML
error page.

**Root cause:** Deployment access set to "Anyone with Google account" (or a stale
deployment version) blocks the un-logged-in Shortcut request.

**Fix:**
- Deploy → **Execute as: Me**, **Who has access: Anyone** (the plain one, NOT
  "Anyone with Google account").
- The `SECRET_TOKEN` is what secures the endpoint, not Google sign-in.

**Takeaway:** For iOS Shortcuts (anonymous clients), access MUST be "Anyone".

---

## 5. Editing code in the editor does NOT update the live Web App

**Symptom:** Code changes (e.g. the sheet fallback, debug echo) didn't take
effect when calling the URL.

**Root cause:** The Web App serves the **deployed version**, not the editor draft.

**Fix:** After any code change:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
This keeps the same `/exec` URL, so the Shortcut needs no change.

**Takeaway:** Code change = redeploy a New version. Same URL is preserved.

---

## 6. `setup()` placeholders revert when you re-paste `Code.gs`

**Symptom:** After re-pasting the updated `Code.gs`, auth started failing
(`Unauthorized: invalid token`).

**Root cause:** Re-pasting the file restored the placeholder
`SECRET_TOKEN: 'CHANGE_ME...'` in `setup()`. Properties are only written when
`setup()` is **run** — the live config still held the old/placeholder value
depending on whether `setup()` was re-run.

**Fix:** After re-pasting, put your real values back in `setup()` and **run
`setup()` again**. The server only ever reads from **Script Properties**, never
from the source file directly.

**Takeaway:** Source `setup()` values are inert until `setup()` runs. Secrets
live in Script Properties.

---

## 7. `{"ok":false,"error":"Unauthorized: invalid token."}`

**Root cause:** The `token` sent by the Shortcut didn't match the stored
`SECRET_TOKEN` (placeholder not replaced, or a typo / trailing space).

**Fix:** Make both identical, character-for-character. Easiest: copy the value
from **Project Settings → Script Properties** and paste it into the Shortcut's
`token` field. Watch for auto-capitalization / trailing spaces from the phone
keyboard.

**Takeaway:** Token mismatches are usually copy/typo errors. Copy-paste, don't
retype.

---

## 8. THE BIG ONE — `{"ok":false,"error":"Invalid or missing \"llc\""}`

**Symptom:** Persisted across many attempts. A debug echo revealed:
`"received_llc":"\"LLC variable\""` and keys like `"description "` and `"filename"`.

**Root cause (two parts):**
1. **Typed text instead of variable chips.** In the Shortcut's JSON body, the
   value boxes literally contained the words `LLC variable`, `Description variable`,
   etc. — typed placeholders, NOT inserted variable **chips**. iOS sent them
   literally. The word "variable" left in a value is the tell-tale sign.
2. **Key names with trailing spaces.** `"description "` (with a space) is a
   different key than `"description"`, so the server read it as empty. Also
   `filename` vs the expected `fileName`.

**Fix:**
- For every value that should be dynamic (llc, description, dining, amount,
  imageBase64): **delete the typed text**, place the cursor in the empty value,
  and **insert the actual variable chip** from the bar above the keyboard
  (or via "Select Variable"). A chip is a shaded capsule you can't edit
  letter-by-letter.
- Keep typed text only for `token` and `fileName`.
- Retype keys with **no trailing spaces**; match casing exactly (`fileName`).

**How to debug this class of issue:** temporarily have the server echo back what
it received (`received_<field>` and `Object.keys(data)`). This converts guessing
into certainty. (We later removed the echo once fixed.)

**Takeaway:** In iOS Shortcuts, a "variable" must be an inserted chip, not typed
words. Verify by tapping the value — if you can edit it like normal text, it's
wrong. Echo the server payload to diagnose.

---

## 9. Choose-from-Menu variable plumbing

**Symptom:** Menu selections (LLC, Dining) didn't reach the request.

**Root cause:** Inside each menu **Case** branch you must add **Text = "Ohio"**
then **Set Variable LLC ← that Text**. If the Set Variable's "to ___" slot is
empty, or the actions sit **below End Menu** instead of inside the Case, the
variable stays blank.

**Fix:**
- Put `Text` + `Set Variable` **inside** each Case branch (indented under it).
- Connect the Set Variable input to the Text output.
- Use the **same variable name** in all branches.
- Simpler alternative: replace the menu with **Ask for Input** (typed) — the
  server validates the value anyway.

**Takeaway:** Menu branch contents must be nested under the Case and the
Set Variable input must be connected.

---

## 10. "Set Variable" with an empty input → blank value

**Symptom:** Description logged blank even after fixing the key.

**Root cause:** The `Set Variable Description` action's **"to ___"** slot wasn't
connected to **Provided Input** (the Ask-for-Input result). Naming the variable
alone does not store anything.

**Fix:** Tap the "to ___" slot → select **Provided Input**. Then ensure the JSON
body's `description` value is the **Description** chip.

**Takeaway:** Set Variable needs BOTH a name AND a connected input.

---

## 11. Quick Look: "No Items — wasn't passed any items to preview"

**Symptom:** The final preview action errored.

**Root cause:** When the old Text/JSON action was deleted, the **Quick Look**
(Show Contents) action lost its input link to **Contents of URL**.

**Fix:** Make Quick Look the **last** action and set its input to **Contents of
URL** (the output of Get Contents of URL).

**Takeaway:** Deleting upstream actions can orphan downstream inputs. Re-link them.

---

## 12. Request Body: use "JSON" key/value fields (most reliable)

**What worked best:** In **Get Contents of URL**, set **Method: POST** and
**Request Body: JSON**, then add one field per key with the value set to a
variable **chip**. This avoids hand-typed JSON (and its quoting/escaping bugs)
entirely and makes it obvious whether a value is a chip or text.

Fields used (key → value):
- `token` → typed text (the secret)
- `llc` → LLC chip
- `description` → Description chip
- `dining` → Dining chip
- `amount` → Amount chip
- `imageBase64` → Base64 Encoded chip
- `fileName` → typed `receipt.jpg`

**Base64 note:** Base64 Encode the photo with **Line Breaks: None**.

---

## 13. PDF saved as `.jpg` — and editing the WRONG body source

**Symptom:** A picked PDF logged fine but was stored as `receipt_..._.jpg`. Adding
`mimeType`/fixing `fileName` in the Shortcut had NO effect across several tries.

**Root cause (two layers):**
1. **The server never received the type.** A temporary debug echo
   (`received_fileName`, `received_mimeType`, `payload_keys`, `base64_prefix`,
   `resolved_type`) revealed the request contained a lowercase `filename` key and
   **no** `mimeType`. The server reads `data.fileName` (camelCase) and
   `data.mimeType`; JSON keys are case-sensitive, so `filename` ≠ `fileName` and
   both came through as `(missing)`. With no type signal, the server fell back to
   its `image/jpeg` default (see [`apps-script/Code.gs`](apps-script/Code.gs:1),
   the MIME resolution line).
2. **Edits weren't landing because there were TWO body definitions.** The
   Shortcut had a hand-typed **Text** action containing `{ ... }` JSON *and* the
   **Get Contents of URL** action's own **Request Body: JSON** key/value fields.
   The request actually sent the key/value fields; the Text block was ignored.
   Editing the ignored block changed nothing — the giveaway was that `payload_keys`
   in the debug echo never changed between runs.

**How we proved it:** the debug echo showed `base64_prefix` starting with
`JVBER` (base64 for `%PDF`), confirming a real PDF was uploaded, while
`payload_keys` stayed identical every run — proving the edited source wasn't the
one being sent.

**Fix:**
- Edit the **actual** body that is sent — the **Request Body: JSON** fields inside
  **Get Contents of URL**, not a separate Text action.
- Send the type by EITHER: adding `mimeType` = typed `application/pdf` (overrides
  everything), OR fixing the key casing to `fileName` and pointing it at a chip
  whose value ends in `.pdf`.
- Confirm the fix reached the request: the debug echo's `payload_keys` must
  change (e.g. now includes `mimeType`). If it doesn't, you edited the wrong
  source again.

**Takeaway:** When Shortcut edits have "no effect," you're probably editing a body
that isn't being sent. Echo `payload_keys` from the server — if it doesn't change,
your edit didn't land. And remember JSON keys are case-sensitive: `filename` is
not `fileName`.

---

## Security lessons
- The `SECRET_TOKEN` is the only thing protecting an "Anyone" web app — keep it
  long, random, and private; never commit it; never paste it in chat/screenshots.
- If a token is ever exposed, **rotate it**: new value in `setup()` → run
  `setup()` → update the Shortcut. (We must rotate the one used during this build
  because it was shared during troubleshooting.)
- Uploaded images are shared "anyone with the link can view" so the Sheet link
  resolves; tighten `setSharing` in `Code.gs` if stricter access is required.

---

## Quick troubleshooting decision tree
1. **HTML "unable to open the file"** → test in incognito/phone; set access to
   "Anyone"; ensure you use the `/exec` URL; redeploy a New version.
2. **`Unauthorized: invalid token`** → token mismatch; copy from Script
   Properties; check for spaces; re-run `setup()`.
3. **`Invalid or missing "llc"/"dining"`** → value is typed text not a chip, or
   the key has a trailing space, or the menu/Set Variable isn't wired. Echo the
   payload to confirm.
4. **A field logs blank** → the value chip isn't inserted, or Set Variable input
   is empty, or the JSON key name has a stray space.
5. **Code change not taking effect** → you didn't redeploy a New version.
6. **Quick Look "No Items"** → re-link its input to Contents of URL.
7. **PDF saved as `.jpg`** → send `mimeType: application/pdf` (or a `.pdf`
   `fileName` chip) in the **Request Body JSON fields** of Get Contents of URL.
   Watch for lowercase `filename` vs `fileName`. Echo `payload_keys` to confirm
   your edit is in the body that is actually sent.

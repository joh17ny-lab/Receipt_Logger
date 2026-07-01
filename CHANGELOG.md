# Changelog

All notable changes to the Receipt Logger are recorded here. Newest entries at
the top. For the deeper "why / root cause" behind fixes, see
[`LESSONS_LEARNED.md`](LESSONS_LEARNED.md:1).

---

## 2026-07-01

### Changed
- **Unique, dashless receipt filenames.** Saved files are now named
  `receipt_<LLC>_<yyyyMMdd>_<HHmmss>` (e.g. `receipt_Indiana_20260701_142530.pdf`)
  instead of `receipt_<LLC>_<YYYY-MM-DD>`.
  - Added an `HHmmss` **time suffix** so multiple receipts for the same LLC on the
    same day get unique, collision-free names.
  - **Removed the dashes** from the date portion of the filename
    (`20260701` instead of `2026-07-01`).
  - The Google Sheet's **Date column is unchanged** — it still uses the dashed
    `YYYY-MM-DD` format via `formatDate_`.

### Implementation notes
- `buildFileBaseName_(llc, date)` in [`apps-script/Code.gs`](apps-script/Code.gs:1)
  now takes a `Date` (was a pre-formatted `dateStr`) and builds the date/time
  parts directly with `Utilities.formatDate(..., 'yyyyMMdd')` and `'HHmmss'`.
- `doPost` creates a single `now` timestamp and passes it to
  `buildFileBaseName_`.
- The file-type/extension logic (content sniffing of base64 magic bytes →
  correct `.pdf` / `.jpg` / `.png`) is **untouched**.
- Updated the note in `LESSONS_LEARNED.md` #14 to reflect the new naming scheme.

### Commits
- `d370e16` — Add time suffix and dashless date to receipt filenames for uniqueness

### Deployment
- **Action required:** redeploy a New version of the Apps Script Web App so the
  change takes effect live: *Deploy → Manage deployments → Edit → Version: New
  version → Deploy.* The `/exec` URL stays the same (see `LESSONS_LEARNED.md` #5).
- Pushed to `main` on GitHub (`joh17ny-lab/Receipt_Logger`). Live redeploy
  confirmed working.

### Still open / follow-ups
- **Rotate the `SECRET_TOKEN`.** It was shared during earlier troubleshooting and
  should be rotated: new value in `setup()` → run `setup()` → update the iOS
  Shortcut (see `LESSONS_LEARNED.md` security section).

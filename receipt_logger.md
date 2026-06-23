# Receipt Logger Agent / Spec

## Overview
The **Receipt Logger** is a serverless system for a small business to capture
receipts from an iPhone and log them to a Google Sheet, with the photo stored in
Google Drive. It is built entirely on Google Apps Script + the iOS Shortcuts app
— no hosted server required.

## Architecture
```
 iPhone (iOS Shortcut)
   │  1. Take photo
   │  2. Ask: LLC, Description, Dining?, Amount
   │  3. POST JSON (+ base64 image) over HTTPS
   ▼
 Google Apps Script Web App (apps-script/Code.gs)
   ├─► Saves the photo to a Google Drive folder (returns a view link)
   └─► Appends a row to the Google Sheet, stamping the current date
   ▼
 Google Sheet
   LLC | Date | Description | Dining | Amount | Image Link
```

## Captured fields
| Sheet column | Source | Allowed / format |
|--------------|--------|------------------|
| LLC | User choice | Ohio, Indiana, California |
| Date | Automatic | current date, `YYYY-MM-DD` |
| Description | User text | free text |
| Dining | User choice | Yes, No |
| Amount | User number | numeric |
| Image Link | Automatic | Google Drive view link to the photo |

## Components
- **iOS Shortcut** — takes the photo, asks the four questions, base64-encodes the
  image, and POSTs JSON to the Web App. See
  [`ios-shortcut/SHORTCUT_SETUP.md`](ios-shortcut/SHORTCUT_SETUP.md:1).
- **Apps Script Web App** — validates the shared token, stores the image in
  Drive, and appends the Sheet row. See [`apps-script/Code.gs`](apps-script/Code.gs:1).
- **Configuration** — Sheet ID, Drive folder ID, and secret token live in Script
  Properties, not in source. See
  [`apps-script/config.sample.md`](apps-script/config.sample.md:1).

## Workflow
1. **Capture** — user triggers the Shortcut and snaps the receipt.
2. **Prompt** — Shortcut asks LLC, Description, Dining?, Amount.
3. **Transmit** — Shortcut POSTs the answers + base64 image with the secret token.
4. **Store image** — Web App saves the photo to the Drive folder and gets a link.
5. **Log row** — Web App appends `LLC | Date | Description | Dining | Amount | Image Link`.
6. **Confirm** — Web App returns a JSON result the Shortcut displays.

## Rules & guidelines
- Reject any request whose `token` does not match the configured `SECRET_TOKEN`.
- Normalize LLC to exactly `Ohio` / `Indiana` / `California`; reject unknown values.
- Normalize Dining to exactly `Yes` / `No`.
- The server always supplies the date (`YYYY-MM-DD`); the user never types it.
- Store the original photo in Drive for audit purposes and record its link.

## Security
- The `SECRET_TOKEN` protects the public Web App URL; keep it long and private.
- Receipt images are shared as "anyone with the link can view" so the Sheet link
  resolves. Tighten `setSharing` in [`apps-script/Code.gs`](apps-script/Code.gs:1)
  if stricter access is needed.

## Repository
Hosted at <https://github.com/joh17ny-lab/Receipt_Logger>. See
[`README.md`](README.md:1) for full setup and deployment instructions.

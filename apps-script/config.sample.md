# Script Properties Configuration

These values are stored in **Project Settings → Script Properties** of your
Apps Script project (or set via the `setup()` function in [`Code.gs`](Code.gs:1)).
**Never commit real secret values to git.**

| Property | Required | Example | Description |
|----------|----------|---------|-------------|
| `SECRET_TOKEN` | Yes | `a8Fk3...long-random...9Zx` | Shared secret. The iOS Shortcut sends this; requests without it are rejected. Generate a long random string. |
| `SHEET_ID` | Yes | `1Wc8Dq2W4HJ7PDPcV1QaJfRPT_NMuNnVg-LDYF6sqkDY` | The ID of the Google Sheet (from its URL). |
| `SHEET_NAME` | No | `Sheet1` | The tab name to append rows to. Defaults to `Sheet1`. |
| `DRIVE_FOLDER_ID` | Yes (for images) | `1AbCdEfGhIjKlMnOpQrStUvWxYz` | The ID of the Google Drive folder where receipt photos are saved. |

## How to find the IDs

- **Sheet ID** — open the Sheet; the URL is
  `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`
- **Drive Folder ID** — open the folder in Drive; the URL is
  `https://drive.google.com/drive/folders/`**`<DRIVE_FOLDER_ID>`**

## Generating a secret token

Run this in a terminal and copy the output:

```bash
# macOS / Linux
openssl rand -hex 24
```

```powershell
# Windows PowerShell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

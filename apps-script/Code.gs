/**
 * Receipt Logger - Google Apps Script Web App
 * --------------------------------------------
 * Receives a receipt photo + form data from an iOS Shortcut,
 * saves the image to a Google Drive folder, and appends a row
 * to the linked Google Sheet.
 *
 * Sheet columns (in order):
 *   LLC | Date | Description | Dining | Amount | Image Link
 *
 * Deployment: Deploy > New deployment > Web app
 *   - Execute as: Me
 *   - Who has access: Anyone (the SECRET_TOKEN protects it)
 *
 * All configuration is read from Script Properties so secrets are
 * never committed to source control. See setup() and README.md.
 */

/**
 * Entry point for POST requests from the iOS Shortcut.
 * Expects a JSON body:
 * {
 *   "token":       "<SECRET_TOKEN>",
 *   "llc":         "Ohio" | "Indiana" | "California",
 *   "description": "Lunch with client",
 *   "dining":      "Yes" | "No",
 *   "amount":      "42.50",
 *   "imageBase64": "<base64-encoded JPEG>",   // optional
 *   "fileName":    "receipt.jpg"              // optional
 * }
 */
function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var expectedToken = props.getProperty('SECRET_TOKEN');
    var sheetId = props.getProperty('SHEET_ID');
    var sheetName = props.getProperty('SHEET_NAME') || 'Sheet1';
    var folderId = props.getProperty('DRIVE_FOLDER_ID');

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse(400, { ok: false, error: 'Missing request body.' });
    }

    var data = JSON.parse(e.postData.contents);

    // ---- Auth ----
    if (!expectedToken) {
      return jsonResponse(500, { ok: false, error: 'Server not configured: SECRET_TOKEN missing. Run setup().' });
    }
    if (!data.token || data.token !== expectedToken) {
      return jsonResponse(401, { ok: false, error: 'Unauthorized: invalid token.' });
    }

    // ---- Validate input ----
    var llc = normalizeLlc_(data.llc);
    if (!llc) {
      return jsonResponse(400, { ok: false, error: 'Invalid or missing "llc". Expected Ohio, Indiana, or California.' });
    }

    var dining = normalizeDining_(data.dining);
    if (!dining) {
      return jsonResponse(400, { ok: false, error: 'Invalid or missing "dining". Expected Yes or No.' });
    }

    var description = (data.description || '').toString().trim();
    var amount = parseAmount_(data.amount);

    // ---- Save image to Drive (optional) ----
    var imageLink = '';
    if (data.imageBase64) {
      if (!folderId) {
        return jsonResponse(500, { ok: false, error: 'Server not configured: DRIVE_FOLDER_ID missing. Run setup().' });
      }
      imageLink = saveImageToDrive_(folderId, data.imageBase64, data.fileName, llc, data.mimeType);
    }

    // ---- Append row to Sheet ----
    if (!sheetId) {
      return jsonResponse(500, { ok: false, error: 'Server not configured: SHEET_ID missing. Run setup().' });
    }
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = getTargetSheet_(ss, sheetName);
    if (!sheet) {
      return jsonResponse(500, { ok: false, error: 'No sheet tab found in the spreadsheet.' });
    }

    var dateStr = formatDate_(new Date());
    // Columns: LLC | Date | Description | Dining | Amount | Image Link
    sheet.appendRow([llc, dateStr, description, dining, amount, imageLink]);

    return jsonResponse(200, {
      ok: true,
      message: 'Receipt logged.',
      row: { llc: llc, date: dateStr, description: description, dining: dining, amount: amount, imageLink: imageLink }
    });
  } catch (err) {
    return jsonResponse(500, { ok: false, error: 'Server error: ' + err.message });
  }
}

/**
 * Simple GET endpoint for health checks. Visit the web app URL in a
 * browser to confirm the deployment is live.
 */
function doGet() {
  return jsonResponse(200, { ok: true, service: 'Receipt Logger', status: 'running' });
}

/**
 * Decodes a base64 file (image or PDF), stores it in the configured Drive
 * folder, makes it viewable by anyone with the link, and returns that link.
 *
 * Type detection is best-effort and BACKWARD COMPATIBLE:
 *   1. An explicit `mimeType` argument wins (e.g. "application/pdf").
 *   2. Otherwise a data-URI prefix on the base64 string is used
 *      (e.g. "data:application/pdf;base64,...").
 *   3. Otherwise the fileName extension is used (".pdf" / ".png" / ...).
 *   4. If nothing indicates a type, it DEFAULTS TO image/jpeg + .jpg,
 *      which is exactly the original camera-flow behavior.
 */
function saveImageToDrive_(folderId, base64, fileName, llc, mimeType) {
  var folder = DriveApp.getFolderById(folderId);

  // Strip any data-URI prefix and remember the type it declared (if any).
  var declaredType = '';
  var prefixMatch = /^data:([^;]+);base64,/.exec(base64);
  if (prefixMatch) { declaredType = prefixMatch[1]; }
  var cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
  var bytes = Utilities.base64Decode(cleanBase64);

  // Resolve the MIME type (explicit arg > data-URI > fileName ext > default).
  var type = (mimeType && mimeType.toString().trim())
    ? mimeType.toString().trim()
    : (declaredType || mimeFromFileName_(fileName) || 'image/jpeg');

  // Build a name with an extension that matches the type.
  var ext = extFromMime_(type);
  var name;
  if (fileName && fileName.toString().trim()) {
    name = fileName.toString().trim();
    // Append the resolved extension if the name lacks any extension.
    if (!/\.[A-Za-z0-9]{1,5}$/.test(name)) { name = name + '.' + ext; }
  } else {
    name = 'receipt_' + llc + '_' + formatTimestamp_(new Date()) + '.' + ext;
  }

  var blob = Utilities.newBlob(bytes, type, name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/** Best-effort MIME type from a file name's extension. Returns '' if unknown. */
function mimeFromFileName_(fileName) {
  if (!fileName) return '';
  var m = /\.([A-Za-z0-9]+)$/.exec(fileName.toString().trim());
  if (!m) return '';
  var ext = m[1].toLowerCase();
  var map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', heic: 'image/heic', webp: 'image/webp',
    pdf: 'application/pdf'
  };
  return map[ext] || '';
}

/** File extension to use for a given MIME type. Defaults to 'jpg'. */
function extFromMime_(type) {
  var map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
    'image/heic': 'heic', 'image/webp': 'webp', 'application/pdf': 'pdf'
  };
  return map[(type || '').toLowerCase()] || 'jpg';
}

/** Maps user input to one of the allowed LLC values. */
function normalizeLlc_(value) {
  if (!value) return '';
  var v = value.toString().trim().toLowerCase();
  var map = { 'ohio': 'Ohio', 'indiana': 'Indiana', 'california': 'California' };
  return map[v] || '';
}

/** Maps user input to "Yes" or "No". */
function normalizeDining_(value) {
  if (value === undefined || value === null) return '';
  var v = value.toString().trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === 'true') return 'Yes';
  if (v === 'no' || v === 'n' || v === 'false') return 'No';
  return '';
}

/** Parses an amount string into a number (2 decimals). Returns '' if invalid. */
function parseAmount_(value) {
  if (value === undefined || value === null || value === '') return '';
  var n = parseFloat(value.toString().replace(/[^0-9.\-]/g, ''));
  if (isNaN(n)) return '';
  return Math.round(n * 100) / 100;
}

/** Formats a date as YYYY-MM-DD in the script's timezone. */
function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Formats a timestamp for unique filenames. */
function formatTimestamp_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
}

/** Builds a JSON HTTP response. */
function jsonResponse(status, obj) {
  // Apps Script web apps always return HTTP 200; status is included in the body.
  obj._status = status;
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * One-time configuration helper. Edit the values below, then run this
 * function once from the Apps Script editor to store your settings in
 * Script Properties. After running, you can delete the values here.
 *
 * NEVER commit real secret values to source control.
 */
function setup() {
  PropertiesService.getScriptProperties().setProperties({
    SECRET_TOKEN: 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
    SHEET_ID: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
    SHEET_NAME: 'Current Year',
    DRIVE_FOLDER_ID: 'PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'
  });
  Logger.log('Script properties saved. Remove real values from setup() now.');
}

/**
 * Returns the target sheet/tab. Tries the configured name first; if that tab
 * does not exist (or no name is configured), falls back to the first tab in
 * the spreadsheet. Returns null only if the spreadsheet has no tabs at all.
 */
function getTargetSheet_(ss, sheetName) {
  if (sheetName) {
    var named = ss.getSheetByName(sheetName);
    if (named) return named;
  }
  var sheets = ss.getSheets();
  return sheets.length ? sheets[0] : null;
}

/**
 * Ensures the header row exists with the correct column names.
 * Run once after setup() if your sheet is empty.
 */
function ensureHeaders() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var sheet = getTargetSheet_(ss, props.getProperty('SHEET_NAME'));
  if (!sheet) {
    Logger.log('ERROR: No sheet tab found in the spreadsheet. Check SHEET_ID.');
    return;
  }
  Logger.log('Using sheet tab: "' + sheet.getName() + '"');
  var headers = ['LLC', 'Date', 'Description', 'Dining', 'Amount', 'Image Link'];
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasHeaders = firstRow.join('').trim() !== '';
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    Logger.log('Headers written.');
  } else {
    Logger.log('Headers already present: ' + firstRow.join(' | '));
  }
}

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
      imageLink = saveImageToDrive_(folderId, data.imageBase64, data.fileName, llc);
    }

    // ---- Append row to Sheet ----
    if (!sheetId) {
      return jsonResponse(500, { ok: false, error: 'Server not configured: SHEET_ID missing. Run setup().' });
    }
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse(500, { ok: false, error: 'Sheet tab "' + sheetName + '" not found.' });
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
 * Decodes a base64 image, stores it in the configured Drive folder,
 * makes it viewable by anyone with the link, and returns that link.
 */
function saveImageToDrive_(folderId, base64, fileName, llc) {
  var folder = DriveApp.getFolderById(folderId);
  var cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  var bytes = Utilities.base64Decode(cleanBase64);
  var name = fileName && fileName.toString().trim()
    ? fileName.toString().trim()
    : 'receipt_' + llc + '_' + formatTimestamp_(new Date()) + '.jpg';
  var blob = Utilities.newBlob(bytes, 'image/jpeg', name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
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
    SHEET_ID: '1Wc8Dq2W4HJ7PDPcV1QaJfRPT_NMuNnVg-LDYF6sqkDY',
    SHEET_NAME: 'Sheet1',
    DRIVE_FOLDER_ID: 'PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE'
  });
  Logger.log('Script properties saved. Remove real values from setup() now.');
}

/**
 * Ensures the header row exists with the correct column names.
 * Run once after setup() if your sheet is empty.
 */
function ensureHeaders() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var sheet = ss.getSheetByName(props.getProperty('SHEET_NAME') || 'Sheet1');
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

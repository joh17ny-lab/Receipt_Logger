# iOS Shortcut Setup — Receipt Logger

This guide builds an iPhone **Shortcut** that:

1. Takes a photo of a receipt
2. Asks: **LLC** (Ohio / Indiana / California), **Description**, **Dining?** (Yes / No), **Amount**
3. Saves the photo to your Google Drive folder *(handled by the Apps Script)*
4. Writes a row to your Google Sheet *(handled by the Apps Script)*
5. The current date is logged automatically by the server

> **Prerequisite:** Deploy the Apps Script Web App first (see the main
> [`README.md`](../README.md:1)) and copy its **Web App URL** and your
> **`SECRET_TOKEN`**.

---

## Build the Shortcut (step by step)

Open the **Shortcuts** app → tap **+** to create a new shortcut → name it
**Log Receipt**. Add the actions below in order.

### 1. Take Photo
- Action: **Take Photo**
- Show Camera Preview: **On**

### 2. Convert photo to Base64
- Action: **Base64 Encode**
- Input: the **Photo** from step 1
- Line Breaks: **None**
- *(This turns the image into text the web app can decode.)*

### 3. Ask for the LLC (menu)
- Action: **Choose from Menu**
- Prompt: `What is the LLC?`
- Menu items: `Ohio`, `Indiana`, `California`
- Inside each menu branch, add a **Text** action containing just that word
  (e.g. the Ohio branch has a Text action with `Ohio`), then a
  **Set Variable** action → variable name `LLC`.

  > Simpler alternative: use **Ask for Input** (Type: Text) with the prompt
  > `What is the LLC? (Ohio / Indiana / California)` and set variable `LLC`.

### 4. Ask for the Description
- Action: **Ask for Input**
- Prompt: `Description?`
- Input Type: **Text**
- Set Variable → `Description`

### 5. Ask Dining? (menu)
- Action: **Choose from Menu**
- Prompt: `Dining?`
- Menu items: `Yes`, `No`
- In the `Yes` branch: **Text** = `Yes` → **Set Variable** `Dining`
- In the `No` branch: **Text** = `No` → **Set Variable** `Dining`

### 6. Ask for the Amount
- Action: **Ask for Input**
- Prompt: `Amount?`
- Input Type: **Number**
- Set Variable → `Amount`

### 7. Build the JSON body
- Action: **Text**
- Paste the following, inserting the variables where shown (tap to pick the
  matching variable token for each `<...>` placeholder):

```json
{
  "token": "PASTE_YOUR_SECRET_TOKEN_HERE",
  "llc": "<LLC>",
  "description": "<Description>",
  "dining": "<Dining>",
  "amount": "<Amount>",
  "imageBase64": "<Base64 Encoded>",
  "fileName": "receipt.jpg"
}
```

> Replace `PASTE_YOUR_SECRET_TOKEN_HERE` with your real `SECRET_TOKEN`.
> The `<Base64 Encoded>` token is the output of step 2.

### 8. Send to the Web App
- Action: **Get Contents of URL**
- URL: your **Web App URL** (ends in `/exec`)
- Method: **POST**
- Request Body: **File** → select the **Text** from step 7
  *(or set Body to "Text" and paste the JSON output)*
- Headers: add `Content-Type` = `application/json`

### 9. Show the result
- Action: **Show Result**
- Input: **Contents of URL** (the server's JSON response)
- This confirms success or shows an error message.

---

## Add it to your Home Screen / Back Tap

- **Home Screen:** In the shortcut's share sheet, choose *Add to Home Screen*.
- **Back Tap:** Settings → Accessibility → Touch → Back Tap → Double Tap →
  select **Log Receipt** to trigger it by tapping the back of your phone.

---

## Testing tips

- Visit your Web App URL in a browser — you should see
  `{"ok":true,"service":"Receipt Logger","status":"running", ...}`.
- If you get `Unauthorized`, the token in step 7 doesn't match `SECRET_TOKEN`.
- If the image link is blank, confirm `DRIVE_FOLDER_ID` is set and the photo
  was Base64-encoded with **Line Breaks: None**.
- The server logs the **date automatically**, so you don't enter it.

## Field reference

| Question (Shortcut) | JSON key | Sheet column | Allowed values |
|---------------------|----------|--------------|----------------|
| What is the LLC? | `llc` | LLC | Ohio, Indiana, California |
| *(automatic)* | — | Date | current date (YYYY-MM-DD) |
| Description? | `description` | Description | free text |
| Dining? | `dining` | Dining | Yes, No |
| Amount? | `amount` | Amount | number |
| *(photo upload)* | `imageBase64` | Image Link | Drive view link |

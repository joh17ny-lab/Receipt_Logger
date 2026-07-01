"""
Generates a printable walkthrough PDF for building the
"Log Receipt (Choose File)" iOS Shortcut, with diagrams.

Requires: fpdf2  (already installed)
Run:      py build_guide_pdf.py
Output:   ../Receipt_Logger_Choose_File_Guide.pdf
"""

import os
from fpdf import FPDF

# ---- Palette ----
NAVY = (24, 43, 77)
BLUE = (46, 108, 199)
LIGHT = (232, 240, 252)
GREEN = (39, 132, 74)
LIGHTGREEN = (224, 242, 231)
AMBER = (176, 122, 12)
LIGHTAMBER = (252, 246, 224)
RED = (176, 40, 40)
LIGHTRED = (250, 230, 230)
GREY = (110, 110, 110)
DARK = (30, 30, 30)
CHIP = (210, 224, 246)


class Guide(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GREY)
        self.cell(0, 6, "Log Receipt (Choose File) - Setup Guide", align="L")
        self.cell(0, 6, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GREY)
        self.cell(0, 6, "Receipt Logger - github.com/joh17ny-lab/Receipt_Logger", align="C")


def title_block(pdf, text):
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(*NAVY)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 12, "  " + text, fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)


def section(pdf, num, text):
    pdf.ln(1)
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(*BLUE)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(9, 8, str(num), fill=True, align="C")
    pdf.set_fill_color(*LIGHT)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 8, "  " + text, fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)


def body(pdf, text):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)


def bullet(pdf, text):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*DARK)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.cell(6, 5.5, "-")
    pdf.set_x(pdf.l_margin + 6)
    pdf.multi_cell(usable - 6, 5.5, text, new_x="LMARGIN", new_y="NEXT")


def callout(pdf, kind, text):
    colors = {
        "tip": (LIGHTGREEN, GREEN, "TIP"),
        "warn": (LIGHTAMBER, AMBER, "WATCH OUT"),
        "err": (LIGHTRED, RED, "COMMON MISTAKE"),
    }
    bg, fg, label = colors[kind]
    pdf.ln(1)
    pdf.set_x(pdf.l_margin)
    y0 = pdf.get_y()
    start_x = pdf.l_margin
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.set_fill_color(*bg)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*fg)
    pdf.multi_cell(usable, 5.2, label + ":  " + text, fill=True,
                   new_x="LMARGIN", new_y="NEXT")
    # left accent bar
    y1 = pdf.get_y()
    pdf.set_fill_color(*fg)
    pdf.rect(start_x, y0, 1.6, y1 - y0, style="F")
    pdf.ln(1)


def flow_box(pdf, x, y, w, h, title, sub, fill, border, tcolor):
    pdf.set_fill_color(*fill)
    pdf.set_draw_color(*border)
    pdf.set_line_width(0.4)
    pdf.rect(x, y, w, h, style="DF", round_corners=True, corner_radius=2)
    pdf.set_xy(x, y + 2.5)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*tcolor)
    pdf.cell(w, 5, title, align="C", new_x="LMARGIN", new_y="NEXT")
    if sub:
        pdf.set_xy(x, y + 8)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(*GREY)
        pdf.cell(w, 4, sub, align="C")


def arrow_down(pdf, x, y, length):
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.6)
    pdf.line(x, y, x, y + length)
    pdf.set_fill_color(*BLUE)
    pdf.line(x - 1.6, y + length - 2, x, y + length)
    pdf.line(x + 1.6, y + length - 2, x, y + length)


# ---------------------------------------------------------------- build
pdf = Guide(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=15)
pdf.set_margins(15, 15, 15)

# ===================== PAGE 1: cover + overview =====================
pdf.add_page()
pdf.ln(20)
pdf.set_x(pdf.l_margin)
pdf.set_font("Helvetica", "B", 26)
pdf.set_text_color(*NAVY)
pdf.multi_cell(0, 12, "Receipt Logger", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_x(pdf.l_margin)
pdf.set_font("Helvetica", "B", 15)
pdf.set_text_color(*BLUE)
pdf.multi_cell(0, 9, 'Building the "Log Receipt (Choose File)" Shortcut',
               align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)
pdf.set_x(pdf.l_margin)
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(*GREY)
pdf.multi_cell(0, 6,
    "A step-by-step guide to duplicate your camera shortcut and change it to\n"
    "pick an existing file (image or PDF) from the Files app or Photo Library.",
    align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)

# overview flow diagram
cx = 105
box_w, box_h = 120, 14
y = pdf.get_y()
flow_box(pdf, cx - box_w/2, y, box_w, box_h,
         "iPhone Shortcut", "picks file + asks LLC / Desc / Dining / Amount",
         LIGHT, BLUE, NAVY)
arrow_down(pdf, cx, y + box_h + 1, 8)
y += box_h + 11
flow_box(pdf, cx - box_w/2, y, box_w, box_h,
         "Google Apps Script Web App", "validates token, decodes the file",
         LIGHT, BLUE, NAVY)
arrow_down(pdf, cx, y + box_h + 1, 8)
y += box_h + 11
flow_box(pdf, cx - box_w/2, y, box_w, box_h,
         "Google Drive + Sheet",
         "saves the file, appends a row with the link",
         LIGHTGREEN, GREEN, GREEN)
pdf.set_y(y + box_h + 8)

callout(pdf, "tip",
    "Start from your WORKING camera shortcut. Duplicating it keeps all the JSON, "
    "token, and POST wiring correct - you only change where the file comes from.")

pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*NAVY)
pdf.multi_cell(0, 6, "What you will change (only 3 things):")
bullet(pdf, "Swap 'Take Photo' for 'Select File'.")
bullet(pdf, "Point 'Base64 Encode' at the picked file (not its name).")
bullet(pdf, "Send the file type so PDFs stay PDFs (mimeType or a .pdf fileName).")

# ===================== PAGE 2: steps 0-3 =====================
pdf.add_page()
title_block(pdf, "Part 1 - Duplicate and swap the source")

section(pdf, 0, "Duplicate the working shortcut")
bullet(pdf, "Open the Shortcuts app.")
bullet(pdf, "Long-press 'Log Receipt' -> Duplicate.")
bullet(pdf, "Open the copy, tap its name, rename it to 'Log Receipt (Choose File)'.")

section(pdf, 1, "Delete the camera action")
bullet(pdf, "Find the 'Take Photo' action (the first action).")
bullet(pdf, "Tap the X on it to delete it.")
callout(pdf, "warn",
    "Deleting Take Photo orphans whatever used its output (Base64 Encode). "
    "You will re-link that in Step 3 - do not skip it.")

section(pdf, 2, "Add the file picker")
body(pdf, "Where Take Photo used to be, add ONE of these:")
bullet(pdf, "Select File  - for PDFs and files from the Files app (best for receipts).")
bullet(pdf, "Select Photos - for existing pictures in your Photo Library.")
body(pdf, "Set 'Select Multiple' to OFF (you want a single file).")

section(pdf, 3, "Re-point Base64 Encode (the critical relink)")
body(pdf, "Tap the Base64 Encode action's Input and set it to the picked file. "
          "Confirm 'Line Breaks: None'.")
callout(pdf, "err",
    "Do NOT encode the file's Name. Encode the FILE ITSELF. Base64-encoding the "
    "filename produces garbage - the saved file will be broken.")

# ===================== PAGE 3: the two-branch diagram =====================
pdf.add_page()
title_block(pdf, "Part 2 - The action flow (5 actions)")

body(pdf, "One 'Select File' feeds TWO separate branches. This is the #1 place "
          "people get confused, so here it is as a picture:")

# diagram
top = pdf.get_y() + 2
cx = 105
# Select File box
sfw, sfh = 70, 13
flow_box(pdf, cx - sfw/2, top, sfw, sfh, "1. Select File",
         "Select Multiple: Off", LIGHT, BLUE, NAVY)

# down to Set Variable ReceiptFile
arrow_down(pdf, cx, top + sfh + 1, 7)
y2 = top + sfh + 9
rvw, rvh = 80, 13
flow_box(pdf, cx - rvw/2, y2, rvw, rvh, "2. Set Variable: ReceiptFile",
         "to  ->  Selected File  (the file!)", LIGHT, BLUE, NAVY)

# split into two branches
split_y = y2 + rvh + 2
pdf.set_draw_color(*BLUE)
pdf.set_line_width(0.6)
lx, rx = 55, 155
pdf.line(cx, split_y, cx, split_y + 5)
pdf.line(lx, split_y + 5, rx, split_y + 5)
pdf.line(lx, split_y + 5, lx, split_y + 10)
pdf.line(rx, split_y + 5, rx, split_y + 10)
# arrowheads
for ax in (lx, rx):
    pdf.line(ax - 1.6, split_y + 8, ax, split_y + 10)
    pdf.line(ax + 1.6, split_y + 8, ax, split_y + 10)

by = split_y + 11
bw, bh = 74, 14
# left branch (contents)
flow_box(pdf, lx - bw/2, by, bw, bh, "3. Base64 Encode",
         "Input: ReceiptFile / Breaks:None", LIGHTGREEN, GREEN, GREEN)
# right branch (name)
flow_box(pdf, rx - bw/2, by, bw, bh, "4. Get Details of Files",
         "Detail: Name / Input: ReceiptFile", LIGHTAMBER, AMBER, AMBER)

arrow_down(pdf, lx, by + bh + 1, 6)
arrow_down(pdf, rx, by + bh + 1, 6)
by2 = by + bh + 8
flow_box(pdf, lx - bw/2, by2, bw, bh, "-> imageBase64",
         "(file contents)", LIGHTGREEN, GREEN, GREEN)
flow_box(pdf, rx - bw/2, by2, bw, bh, "5. Set Var: FileName",
         "then -> fileName key", LIGHTAMBER, AMBER, AMBER)

pdf.set_y(by2 + bh + 6)
callout(pdf, "tip",
    "LEFT branch = the file's CONTENTS -> imageBase64.   "
    "RIGHT branch = the file's NAME -> fileName.   "
    "Two different outputs of the same Select File.")

body(pdf, "In the JSON body action, set the values to CHIPS (shaded capsules), "
          "not typed words:")
bullet(pdf, "imageBase64  ->  the 'Base64 Encoded' chip (from step 3)")
bullet(pdf, "fileName     ->  the 'FileName' chip (from step 5)")

# ===================== PAGE 4: JSON body + PDF fix =====================
pdf.add_page()
title_block(pdf, "Part 3 - The JSON body & making PDFs stay PDFs")

section(pdf, 6, "What the JSON body should look like")
body(pdf, "In 'Get Contents of URL' -> Request Body: JSON, one field per key. "
          "Chips are shown here as shaded capsules; token/mimeType are typed text.")

# mock JSON panel
jx, jy, jw = 15, pdf.get_y() + 1, 180
rows = [
    ("token", "your-secret-token", "text"),
    ("llc", "LLC", "chip"),
    ("description", "Description", "chip"),
    ("dining", "Dining", "chip"),
    ("amount", "Amount", "chip"),
    ("imageBase64", "Base64 Encoded", "chip"),
    ("fileName", "FileName", "chip"),
    ("mimeType", "application/pdf", "text"),
]
rh = 8
panel_h = rh * len(rows) + 6
pdf.set_fill_color(248, 249, 251)
pdf.set_draw_color(*GREY)
pdf.set_line_width(0.3)
pdf.rect(jx, jy, jw, panel_h, style="DF", round_corners=True, corner_radius=2)
ry = jy + 3
for key, val, kind in rows:
    pdf.set_xy(jx + 4, ry)
    pdf.set_font("Courier", "B", 10)
    pdf.set_text_color(*NAVY)
    pdf.cell(45, rh - 1, key)
    if kind == "chip":
        pdf.set_fill_color(*CHIP)
        cw = pdf.get_string_width(val) + 8
        pdf.set_xy(jx + 55, ry + 0.5)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*NAVY)
        pdf.cell(cw, rh - 2, val, fill=True, align="C",
                 border=0, new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.set_xy(jx + 55, ry)
        pdf.set_font("Courier", "", 9.5)
        pdf.set_text_color(*DARK)
        pdf.cell(0, rh - 1, val)
    ry += rh
pdf.set_y(jy + panel_h + 4)

callout(pdf, "tip",
    "The last line, mimeType = application/pdf, is the reliable fix for a "
    "PDF-only shortcut. It overrides everything, so files always save as .pdf.")

section(pdf, 7, "Why a PDF was saving as .jpg (and how to fix it)")
body(pdf, "The server picks the file type in this order:")
bullet(pdf, "1. explicit 'mimeType' you send  (wins)")
bullet(pdf, "2. a data-URI prefix on the base64  (iOS does not add this)")
bullet(pdf, "3. the extension in 'fileName'  (e.g. ends in .pdf)")
bullet(pdf, "4. if none of the above: DEFAULT to JPEG  -> your file becomes .jpg")
callout(pdf, "err",
    "If fileName is still the typed 'receipt.jpg' left from the camera shortcut, "
    "the server reads .jpg and saves a .jpg. Fix: send mimeType=application/pdf, "
    "OR set fileName to the real FileName chip (which ends in .pdf).")
body(pdf, "This is purely a shortcut/JSON fix - you do NOT need to redeploy the "
          "web app for it.")

# ===================== PAGE 5: test + checklist =====================
pdf.add_page()
title_block(pdf, "Part 4 - Test it & final checklist")

section(pdf, 8, "Test the shortcut")
bullet(pdf, "Run the shortcut and pick a PDF receipt.")
bullet(pdf, "Expect a response like:  {\"ok\":true,\"message\":\"Receipt logged.\"}")
bullet(pdf, "Open the Google Sheet: a new row should appear.")
bullet(pdf, "Click the Image Link - it should open a .pdf (not a .jpg).")

section(pdf, 9, "Final checklist")
checks = [
    "Shortcut renamed to 'Log Receipt (Choose File)'",
    "Take Photo deleted; Select File added (Multiple: Off)",
    "Set Variable ReceiptFile = Selected File (the file, not the name)",
    "Base64 Encode input = ReceiptFile, Line Breaks: None",
    "Get Details of Files (Name) + Set Variable FileName",
    "JSON: imageBase64 = Base64 chip, fileName = FileName chip",
    "JSON: mimeType = application/pdf  (or fileName ends in .pdf)",
    "Tested with a real PDF; Image Link opens a .pdf",
]
pdf.ln(1)
for c in checks:
    x = pdf.get_x()
    y = pdf.get_y()
    pdf.set_draw_color(*BLUE)
    pdf.set_line_width(0.4)
    pdf.rect(x, y + 0.8, 4, 4, round_corners=True, corner_radius=0.6)
    pdf.set_x(pdf.l_margin + 7)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*DARK)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.multi_cell(usable - 7, 6, c, new_x="LMARGIN", new_y="NEXT")

pdf.ln(3)
callout(pdf, "warn",
    "If you ever edit the Apps Script code, you MUST redeploy a NEW version "
    "(Deploy -> Manage deployments -> Edit -> New version). The /exec URL stays "
    "the same, so the shortcut needs no change.")

pdf.ln(2)
pdf.set_x(pdf.l_margin)
pdf.set_font("Helvetica", "I", 9)
pdf.set_text_color(*GREY)
pdf.multi_cell(0, 5,
    "More detail lives in ios-shortcut/SHORTCUT_SETUP.md and "
    "LESSONS_LEARNED.md in the repo.", new_x="LMARGIN", new_y="NEXT")

# ---- save ----
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                   "Receipt_Logger_Choose_File_Guide.pdf")
out = os.path.abspath(out)
pdf.output(out)
print("WROTE:", out)

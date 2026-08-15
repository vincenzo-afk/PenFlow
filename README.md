# PenFlow

> Turn typed source material into study-ready handwritten notebook pages.

PenFlow is a browser-first handwriting notes studio. It converts your source text into an editable, locally rendered canvas page and gives you practical paper, ink, OCR, study-shaping, storage, and export controls.

## Working features

| Feature | What it does |
| --- | --- |
| **Live handwriting canvas** | Renders text as deterministic, varied handwritten strokes with four styles: Scholar, Quick notes, Cursive, and Blueprint. |
| **Paper and ink controls** | Select ruled, graph, dot-grid, or blank paper; change ink color, density, and paper realism. |
| **Study shaping** | Restructures imported or pasted material into concise headings and revision bullets directly in the browser. |
| **OCR import** | Reads JPG and PNG page scans using Tesseract.js in the browser. Text and Markdown files can also be imported. |
| **Exports** | Saves the rendered notebook page as a PNG or print-ready A4 PDF. |
| **Notebook library** | Saves and reopens up to 12 local notes using browser storage. No account is required. |

## Local development

```bash
pnpm install
pnpm dev
```

Run a production validation with:

```bash
pnpm check
pnpm build
```

## Technical approach

PenFlow is a React 19 + TypeScript + Vite application. The visual page is drawn with the Canvas API, so handwriting, paper grain, margin rules, and the folded page corner are rendered locally. The app loads Tesseract.js and jsPDF from trusted CDN scripts for optional OCR and PDF export.

## Repository topics

`ai` · `handwriting` · `notes` · `ocr` · `pdf` · `study` · `education` · `canvas` · `paper` · `notebook` · `document-generator`

## Privacy note

Writing, study shaping, preview generation, local-library storage, and exports remain in the browser. OCR processes selected images in the browser through Tesseract.js.

# PenFlow

> Turn typed source material into study-ready handwritten notebook pages.

PenFlow is a browser-first handwriting notes studio. It converts your source text into an editable, locally rendered canvas page and gives you practical paper, ink, OCR, study-shaping, storage, and export controls.

## Working features

| Feature | What it does |
| --- | --- |
| **Human-like handwriting engine** | Renders deterministic but naturally varied handwriting with six writing identities, per-character baseline shifts, rotation, spacing, pressure changes, ink flow, tremor, and re-shufflable variation seeds. |
| **Custom pen desk** | Select gel, ballpoint, fountain pen, felt tip, pencil, or highlighter; tune the ink color, custom color swatch, nib width, opacity, pressure, and ink-flow behavior. |
| **Paper and page stock** | Select ten paper layouts, including ruled, narrow rule, graph, dot-grid, Cornell, planner, lab book, music staff, and flashcard. Configure paper tone, texture, margin rule, page fold, and hole-punch or spiral binding. |
| **Corrections and annotations** | Add editable underline, double underline, highlight, strike-through, scribble, circle, bracket, and arrow marks to phrases selected in the source. Choose human correction modes including single/double strike, scribble, whiteout, caret, and margin notes. |
| **Writing profiles** | Apply built-in writing identities or save local custom pen-and-paper profiles for later pages. Appearance history supports Undo and Redo. |
| **Study shaping** | Restructures imported or pasted material into concise headings and revision bullets directly in the browser. |
| **OCR import** | Reads JPG and PNG page scans using Tesseract.js in the browser. Text and Markdown files can also be imported. |
| **Multi-sheet exports** | Exports the active handwritten sheet as PNG or produces a PDF with every automatically paginated sheet. |
| **Notebook library** | Saves and reopens up to 12 local notes with the full paper, pen, humanization, and annotation settings using browser storage. No account is required. |

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

PenFlow is a React 19 + TypeScript + Vite application. The visual page is drawn with the Canvas API, so handwriting, paper grain, margin rules, correction marks, binding details, and the folded page corner are rendered locally. The `DocumentAppearance` model keeps every pen, handwriting, humanization, paper, and correction setting together, allowing a saved note or a writing profile to reproduce the same visual identity. The app loads Tesseract.js and jsPDF from trusted CDN scripts for optional OCR and PDF export.

## Repository topics

`ai` · `handwriting` · `notes` · `ocr` · `pdf` · `study` · `education` · `canvas` · `paper` · `notebook` · `document-generator`

## Privacy note

Writing, study shaping, preview generation, local-library storage, and exports remain in the browser. OCR processes selected images in the browser through Tesseract.js.

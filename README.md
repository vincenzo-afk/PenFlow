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
| **Pressure-aware direct ink** | Draw directly onto any generated page with a mouse, touch input, or compatible stylus. Pen, highlighter, and eraser modes retain stroke pressure, size, ink opacity, and order as an editable local ink layer. |
| **Stroke replay** | Replay the active page’s recorded ink strokes from first mark to last, then export the completed direct-ink layer with the handwritten document. |
| **Local writing calibration** | Capture a guided handwritten sample and derive a reusable visual writing profile from pressure, pace, slant, scale, spacing, baseline drift, and tremor. The profile updates PenFlow’s editable appearance controls without uploading the sample. |
| **Live profile proof** | Shows the generated visual writing profile on a reference sheet while the user is still writing the sample. The sheet is unchanged until the user explicitly applies the preview; profiles may also be saved without applying them. |
| **Replay sharing** | Turns the active page’s saved direct-ink timeline into a shareable animated GIF. Where the browser provides `MediaRecorder` support, it can also export a local MP4 or WebM replay and explains the available format in the interface. |
| **Multi-page session reels** | Combines every inked sheet in a multi-page note into a continuous local GIF or browser-supported MP4/WebM reel. Page transitions, pacing, resolution, progress, and device-only downloads make longer handwriting sessions ready to share. |
| **Profile comparison proofs** | Shows up to four local writing profiles as side-by-side paper proofs. Selecting a card only marks it for review; applying a profile remains a separate, explicit action. |
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

PenFlow is a React 19 + TypeScript + Vite application. The visual page is drawn with the Canvas API, so handwriting, paper grain, margin rules, correction marks, binding details, direct ink, and the folded page corner are rendered locally. The `DocumentAppearance` model keeps every pen, handwriting, humanization, paper, and correction setting together, while the local drawing model keeps editable pointer samples, provisional calibration previews, calibrated writing profiles, and deterministic replay timing in browser storage. The app uses `gifenc` for browser-local animated GIF encoding and browser media recording for optional local replay video exports.

## Repository topics

`ai` · `handwriting` · `notes` · `ocr` · `pdf` · `study` · `education` · `canvas` · `paper` · `notebook` · `document-generator`

## Privacy note

Writing, study shaping, preview generation, local-library storage, calibration, and replay exports remain in the browser. OCR processes selected images in the browser through Tesseract.js. Replay media is rendered from locally stored direct-ink strokes and downloaded to the device; it is not uploaded by PenFlow. A session reel requires ink on at least two distinct pages and orders those inked pages by notebook page number.

> **Calibration scope:** PenFlow derives an editable *visual writing profile* from the motion and pressure traits in a voluntary sample. It does not identify a person, create a biometric identity, or claim to reproduce exact personal letterforms.

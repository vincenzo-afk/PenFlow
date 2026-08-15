# PenFlow

**Transform typed text into realistic handwritten notebook pages — powered by AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Topics:** `ai` · `handwriting` · `notes` · `ocr` · `pdf` · `study` · `education` · `canvas` · `paper` · `notebook` · `document-generator`

PenFlow is a web-based platform that converts plain typed or pasted text into highly realistic handwritten notebook pages that are almost indistinguishable from actual human handwriting. Unlike traditional handwriting generators that simply swap fonts, PenFlow intelligently recreates the natural imperfections of real handwriting — varying letter sizes, inconsistent spacing, realistic pen pressure, subtle baseline shifts, occasional corrections, and natural writing flow — and renders them onto authentic notebook paper templates using a procedural canvas engine.

## ✨ Key Features

### Handwriting Engine
- **Procedural handwriting variation** — character-level jitter in shape, rotation, height, width, and spacing; words naturally follow notebook lines with micro-deviations
- **Multiple handwriting styles** — neat student, fast classroom notes, cursive, exam handwriting, teacher handwriting, calligraphy, engineering notes, and messy rough-note styles
- **Pen simulation** — ink color (blue, black, red, green), thickness, texture, slant, writing-speed simulation, variable ink density, and pressure changes
- **Randomness control** — dial handwriting from perfectly neat to naturally imperfect
- **Realism effects** — paper shadows, folds, page curls, ink bleeding, scanned-paper texture, camera perspective distortion, and mobile-photo style lighting

### Editor & Input
- Type, paste, or **drag-and-drop** text directly into the notebook editor
- **Import from PDF, DOCX, TXT, Markdown, or images via OCR** (Tesseract.js)
- **Live handwriting preview** as you type
- AI proofreading: grammar, spelling, and formatting fixes before generation

### AI Study Assistant
- Auto-convert raw text into **structured study notes** — headings, subheadings, bullets, numbered lists, summaries, highlighted keywords, definitions, examples, formulas, revision boxes
- **Automatic pagination** across notebook pages with margin preservation
- Generate **flashcards, mind maps, revision summaries, lecture notes, assignment answers**, and cheat sheets from prompts or uploaded material
- Handwritten-style **math equations, chemical formulas, diagrams, flowcharts, and tables**

### Paper & Templates
- **A4 ruled, single-line ruled, double-line ruled, graph, blank, and engineering paper**
- Custom templates with adjustable margins, headers, footers, dates, and page numbers
- Multilingual support with proper character rendering (English + more)

### Export & Sharing
- Download as **PNG, JPG, PDF, or SVG** — single pages, full notebooks, or merged PDFs
- Printable A4 documents and notebook preview mode with page-flip animations
- Mobile view that displays notes as photographed notebook pages for easy sharing

### Workspace & Productivity
- Organize notes into **folders, subjects, semesters, and notebooks**
- Saved handwriting presets, reusable templates, favorites, and generation history
- **Cloud sync** across desktop, tablet, and mobile; version history and auto-save

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React / Next.js, TypeScript, HTML5 Canvas, Tailwind CSS |
| Handwriting Rendering | Procedural SVG path generation + Canvas rendering engine (no font-only fallback) |
| OCR | Tesseract.js (browser-native, privacy-friendly) |
| Backend | Node.js (Express) / FastAPI — document processing, rendering orchestration, auth |
| AI | Language model API for note structuring, summarization, flashcards, and proofreading |
| Storage & DB | PostgreSQL / MongoDB + Supabase Storage or AWS S3 |
| PDF Export | jsPDF / pdfkit for high-resolution A4 documents |

## 📂 Project Structure

```
PenFlow/
├── README.md                # Project overview (this file)
├── docs/
│   ├── ARCHITECTURE.md      # System design and rendering pipeline
│   ├── FEATURES.md          # Complete feature specification
│   └── ROADMAP.md           # Phased development roadmap
├── src/
│   ├── engine/
│   │   ├── handwriting.js   # Procedural handwriting variation engine
│   │   ├── paper.js         # Paper template and background renderer
│   │   └── renderer.js      # Canvas composition and export pipeline
│   ├── ai/
│   │   └── note-builder.js  # AI study-note structuring module
│   ├── ocr/
│   │   └── ocr.js           # Tesseract.js OCR pipeline
│   ├── ui/
│   │   └── editor.js        # Notebook editor UI scaffold
│   └── index.html           # Demo entry point
├── assets/                  # Fonts, textures, style presets
├── LICENSE
└── package.json
```

## 🚀 Getting Started

```bash
git clone https://github.com/vincenzo-afk/PenFlow-.git
cd PenFlow-
npm install
npm start          # launches the handwriting demo on localhost
```

Open `src/index.html` in any modern browser to try the handwriting demo immediately — no build step required.

## 📋 How It Works

1. **Input** — Text arrives via typing, pasting, file upload, or OCR extraction.
2. **AI structuring (optional)** — Raw text is organized into headings, lists, and revision blocks.
3. **Variation pass** — The handwriting engine assigns per-character jitter, slant, baseline drift, and spacing deviations based on the chosen style preset.
4. **Stroke rendering** — Characters are drawn as procedural SVG-derived strokes on the canvas, following the paper's ruled lines with realistic pen pressure curves.
5. **Paper composition** — Notebook template, margins, headers, page numbers, and realism effects (shadows, ink bleed, scan texture) are composited.
6. **Export** — The final canvas is exported as PNG/JPG/PDF/SVG at print resolution.

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

Made with ❤️ by [vincenzo-afk](https://github.com/vincenzo-afk)

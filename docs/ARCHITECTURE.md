# PenFlow — Architecture

## 1. System Overview

PenFlow is organized as a three-tier web application: a **browser-first rendering layer** that generates handwritten pages entirely client-side (no server required for core generation), an **optional backend layer** for persistence, collaboration, and heavy AI workloads, and a **storage layer** for user accounts, notebooks, templates, and export artifacts.

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Editor UI │──│  AI Note   │──│ Handwriting  │──│  Export │ │
│  │ (React)    │  │  Builder   │  │ Engine       │  │ Pipeline│ │
│  └────────────┘  └────────────┘  └──────────────┘  └─────────┘ │
│         │               │                │               │       │
│         │          ┌────▼────┐      ┌──────▼─────┐     │       │
│         │          │  LLM    │      │   Canvas   │     │       │
│         └──────────┤  API    │      │  Renderer  │◄────┘       │
│                    └─────────┘      └────────────┘             │
│         ┌──────────────────────────────────────────────────┐   │
│         │  OCR (Tesseract.js) · Page Templates · Style DB  │   │
│         └──────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                        BACKEND (optional)                        │
│  REST API (Node/Express or FastAPI): auth · projects · exports   │
│  AI orchestration: note structuring, flashcards, summarization   │
├──────────────────────────────────────────────────────────────────┤
│                        STORAGE                                   │
│  PostgreSQL/MongoDB (users, projects, presets, history)          │
│  S3 / Supabase Storage (generated PNG/PDF/SVG assets)            │
└──────────────────────────────────────────────────────────────────┘
```

## 2. The Handwriting Pipeline

The core of PenFlow is its rendering pipeline. Text flows through five deterministic + stochastic stages so that every page is reproducible with a seed yet visually organic.

### Stage 1 — Tokenization & Layout Planning

Input text is split into paragraphs, sentences, words, and characters. The layout planner assigns each line to a notebook ruled line, computes left margin, indentation (including hanging indents for bullets and numbered lists), and reserves vertical space for headings, diagrams, tables, and revision boxes. Page breaks are computed so that no block is orphaned at the bottom of a page.

### Stage 2 — Variation Assignment

Each character receives a **variation vector** derived from:

- A **style preset** (neat student, fast classroom, cursive, exam, teacher, calligraphy, engineering, messy rough) — a deterministic profile of jitter ranges, slant, and spacing parameters
- A **global randomness seed** so the same document with the same seed renders identically
- **Local context** — characters adjacent to line starts, after corrections, or inside emphasized text get different treatment

Variation parameters include: glyph height deviation, width deviation, rotation (±2° typical), baseline offset, intra-letter spacing, inter-word spacing, and stroke velocity.

### Stage 3 — Stroke Synthesis

Characters are not drawn from fonts alone. The engine deforms glyph outlines by displacing control points along the stroke path according to the variation vector, producing **procedural SVG paths** that mimic:

- Pen pressure (thicker downstrokes, thinner hairlines)
- Micro-hesitations and writing pauses
- Occasional over-tracing of letters (realistic re-drawing)
- Ink pooling at stroke endpoints for ballpoint realism

### Stage 4 — Paper Composition

The canvas renderer composites, in z-order:

1. Paper template (A4 ruled / single / double ruled / graph / blank / engineering)
2. Shadows, folds, and page-curl gradients (optional realism pack)
3. Handwritten strokes from Stage 3, line-by-line
4. Ink bleed / scan-noise overlay (optional)
5. Camera-perspective transform for mobile-photo look (optional)

### Stage 5 — Export

The final composition is captured at **300 DPI print resolution** and exported as PNG, JPG, SVG (vector strokes preserved), or multipage PDF via jsPDF. Merged notebook PDFs reuse a single document stream for consistent printing.

## 3. Key Modules

| Module | Responsibility | Inputs | Outputs |
|---|---|---|---|
| `engine/handwriting.js` | Variation engine + stroke synthesis | Text tokens, style preset, seed | Deformed glyph stroke paths |
| `engine/paper.js` | Template geometry and background rendering | Paper type, margin config | Canvas background layer |
| `engine/renderer.js` | Composition, effects, and export orchestration | Layers from above | PNG/JPG/SVG/PDF bytes |
| `ai/note-builder.js` | LLM-powered structuring (headings, lists, summaries, flashcards) | Raw text, prompt | Structured note JSON |
| `ocr/ocr.js` | Tesseract.js extraction + cleanup | Image/PDF scans | Clean text |
| `ui/editor.js` | Notebook editor, live preview, settings panel | User events | Editor state |

## 4. Data Flow for a Typical Session

1. User pastes an essay → `ocr/ocr.js` (if image) or direct text.
2. User clicks "Structure with AI" → `ai/note-builder.js` calls the LLM, returns a structured note schema (blocks with types: heading, paragraph, bullet, formula, revision-box).
3. Editor renders the structured note; user adjusts style, pen color, paper template, realism effects.
4. Live preview re-renders the canvas on every change (debounced).
5. On export, `renderer.js` composes all pages and streams the chosen format to download, optionally uploading to cloud storage for the shared workspace.

## 5. Performance Targets

- First preview under 500 ms for a 500-word page (Web Worker for stroke synthesis)
- Full 40-page notebook PDF under 10 s
- Tesseract.js OCR of one A4 scan under 5 s in-browser
- Deterministic re-rendering from seed for collaboration consistency

## 6. Future: AI-Assisted Handwriting Synthesis

The procedural engine is augmented later with an ML layer (style transfer or conditional stroke generation) that learns a user's own handwriting from a few written samples, enabling true **personal handwriting cloning** while the procedural engine remains the zero-data fallback.

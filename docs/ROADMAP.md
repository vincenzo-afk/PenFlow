# PenFlow — Roadmap

This roadmap describes the phased development of PenFlow from a client-side handwriting demo to a full AI-powered study workspace.

## Phase 1 — Core Handwriting Engine (Foundation)

The foundation phase delivers a working, shareable product: a browser-based engine that converts any text into realistic handwritten notebook pages with no backend required. Work includes completing the procedural stroke-synthesis engine, shipping eight handwriting style presets, building the paper template library (ruled, graph, blank, engineering), adding the live preview editor with pen color/thickness/slant controls, and implementing high-resolution PNG and multipage PDF export at A4 print quality.

**Deliverables:** functional demo at `src/index.html`; export pipeline; style preset system; template system.

## Phase 2 — Import, AI, and Workspace

Phase 2 turns the demo into a usable product. Tesseract.js OCR is wired up so users can photograph handwritten or printed documents and convert them into editable text, followed by an AI proofreading pass. A language-model integration enables the AI Study Assistant: automatic structuring of raw text into headings, lists, and revision boxes, plus flashcard and assignment-answer generation. The workspace layer adds folders, subjects, semesters, saved handwriting presets, reusable templates, favorites, and generation history with auto-save drafts.

**Deliverables:** OCR import flow; AI note-builder API; preset/template persistence; folder-based organization.

## Phase 3 — Realism, STEM, and Multilingual

Phase 3 focuses on depth and fidelity. Realism effects — ink bleed, scan texture, page shadows, folds, and camera-perspective distortion — make exports indistinguishable from photographs of real notebooks. STEM support adds handwritten-style math equations, chemical formulas, hand-drawn diagrams, flowcharts, and tables. Multilingual rendering extends coverage to Devanagari, Arabic, and CJK scripts. Generation modes for lecture notes, cheat sheets, and mind maps round out the study toolkit.

**Deliverables:** realism effects pack; math/diagram rendering; three additional scripts; new generation modes.

## Phase 4 — Cloud, Collaboration, and Handwriting Cloning

The final phase adds the platform layer: user accounts and authentication, cloud sync across devices, shared view-only notebook links, and project analytics. The flagship research feature, personal handwriting cloning, uses style-transfer learning from a few user-written samples to generate text in the user's own hand. A PWA wrapper makes the app installable on mobile, with planned native iOS/Android builds afterward.

**Deliverables:** auth + cloud sync; collaboration links; ML handwriting cloning; PWA release.

## Progress Tracker

| Phase | Status |
|---|---|
| Phase 1 — Core engine, templates, preview, export | 🟡 In progress (prototype in `src/engine`) |
| Phase 2 — OCR, AI assistant, workspace | ⬜ Planned |
| Phase 3 — Realism, STEM, multilingual | ⬜ Planned |
| Phase 4 — Cloud, collaboration, cloning | ⬜ Planned |

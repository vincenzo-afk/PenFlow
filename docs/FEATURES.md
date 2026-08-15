# PenFlow — Complete Feature Specification

## 1. Handwriting Generation

| Feature | Description | Status |
|---|---|---|
| Procedural handwriting engine | Character-level variation (size, rotation, baseline, spacing) rendered as deformed strokes — not font-only | Prototype |
| Handwriting styles | Neat student, fast classroom, cursive, exam, teacher, calligraphy, engineering, messy rough | Prototype |
| Pen customization | Color (blue/black/red/green/custom), thickness, ink texture, slant | Prototype |
| Randomness dial | Control imperfection from perfectly neat → naturally messy | Prototype |
| Realism effects | Paper shadow, fold lines, page curl, ink bleeding, scan texture, camera perspective, mobile-photo lighting | Planned |
| Corrections simulation | Occasional strikethroughs and rewritten words for authenticity | Planned |
| Personal handwriting cloning | Learn a user's own handwriting from samples via ML style transfer | Future |

## 2. Paper & Templates

- A4 ruled paper, single-line ruled, double-line ruled, graph paper, blank sheets, engineering paper
- Custom page templates with user-defined margins, gutter, header, footer, date stamp, page numbering
- Multilingual rendering (English primary; Devanagari, Arabic, CJK planned)
- Subject-branded templates (math notebook, lab record, diary, planner)

## 3. Input & OCR

- Type, paste, or drag-and-drop text
- File import: PDF, DOCX, TXT, Markdown
- **Image-to-text OCR** via Tesseract.js (browser-native, no upload needed)
- OCR correction tools: clean scanned text, deskew, denoise before extraction
- AI proofreading pass (grammar, spelling, formatting) before handwriting generation

## 4. AI Study Assistant

- **Auto-structuring**: raw text → headings, subheadings, bullets, numbered lists, summaries, highlighted keywords
- **Revision blocks**: definitions, important points, examples, formulas boxed for revision
- **Flashcard generation** from any uploaded material
- **Mind maps** converted to hand-drawn style diagrams
- **Lecture-note mode**: long transcripts → concise structured notes with pagination
- **Assignment answer generator** with appropriate academic formatting
- **Cheat-sheet mode**: condensed one-page summaries
- Handwritten-style math equations, chemical formulas, diagrams, flowcharts, and tables

## 5. Editing & Preview

- Live handwriting preview while typing (debounced)
- Notebook page-flip preview with realistic animation
- Per-block overrides (e.g., make one paragraph red-pen emphasized)
- Highlighting, underlining, and bullet/number formatting in the editor
- Undo/redo, auto-save drafts, version history

## 6. Export & Sharing

- High-resolution PNG, JPG, SVG (vector strokes preserved), PDF (single and merged multipage)
- Printable A4 document export
- Mobile-photo view for sharing on messaging apps and social media
- Watermark toggle, signature insertion, notebook branding control

## 7. Workspace & Productivity

- Folder hierarchy: folders → subjects → semesters → notebooks
- Saved handwriting presets and reusable templates
- Favorites, recent generations, and full generation history
- Cloud sync across desktop, tablet, and mobile
- Shared notebooks (link-based view-only collaboration)
- Project stats: pages generated, words written, time saved

## 8. Accessibility & Offline

- Full keyboard navigation and screen-reader-friendly editor
- PWA support — installable, works offline for generation (core engine is client-side)
- Dark/light UI themes (note output remains paper-styled)

## Feature Roadmap Summary

| Phase | Milestone |
|---|---|
| Phase 1 | Core handwriting engine, paper templates, live preview, PNG/PDF export |
| Phase 2 | OCR import, AI note structuring, style presets, workspace basics |
| Phase 3 | Realism effects, math/diagram support, multilingual, flashcards & mind maps |
| Phase 4 | Cloud sync, collaboration, handwriting cloning, PWA/mobile apps |

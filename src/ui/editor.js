/**
 * PenFlow — Notebook Editor UI Scaffold
 *
 * A lightweight vanilla-JS editor that wires the handwriting engine, paper
 * templates, AI note-builder, and OCR into a live handwriting preview with
 * settings controls and multi-format export.
 */

import { STYLES } from "../engine/handwriting.js";
import { PAPER_TYPES, INK_COLORS } from "../engine/paper.js";
import { renderNotebook, downloadPNG, downloadPDF } from "../engine/renderer.js";
import { structureNotesHeuristic } from "../ai/note-builder.js";
import { recognizeText } from "../ocr/ocr.js";

export class PenFlowEditor {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string" ? document.querySelector(container) : container;
    this.text = "";
    this.settings = {
      style: "neatStudent",
      color: "blue",
      thickness: 1.6,
      paper: "a4Ruled",
      realism: false,
      date: "",
      title: "",
      seed: 42,
    };
    this.mount();
  }

  mount() {
    this.container.innerHTML = `
      <div class="pf-layout">
        <section class="pf-input-panel">
          <h3>✍️ Your Text</h3>
          <textarea id="pf-text" placeholder="Type or paste your notes here…"></textarea>
          <div class="pf-row">
            <button id="pf-structure">🤖 Structure with AI</button>
            <label class="pf-file-btn">
              📷 Import image (OCR)
              <input type="file" id="pf-import-img" accept="image/*" hidden>
            </label>
          </div>
          <p id="pf-status"></p>
        </section>
        <section class="pf-preview-panel">
          <h3>📓 Live Preview</h3>
          <div id="pf-canvas-wrap"></div>
          <div class="pf-row">
            <button id="pf-export-png">⬇ PNG</button>
            <button id="pf-export-pdf">⬇ PDF</button>
          </div>
        </section>
        <aside class="pf-settings-panel">
          <h3>⚙️ Settings</h3>
          <label>Handwriting style
            <select id="pf-style">${Object.entries(STYLES)
              .map(([k, v]) => `<option value="${k}">${v.name}</option>`)
              .join("")}</select>
          </label>
          <label>Pen color
            <select id="pf-color">${Object.entries(INK_COLORS)
              .map(([k, v]) => `<option value="${k}">${k}</option>`)
              .join("")}</select>
          </label>
          <label>Pen thickness
            <input type="range" id="pf-thickness" min="1" max="3" step="0.1" value="1.6">
          </label>
          <label>Paper
            <select id="pf-paper">${Object.entries(PAPER_TYPES)
              .map(([k, v]) => `<option value="${k}">${v.name}</option>`)
              .join("")}</select>
          </label>
          <label><input type="checkbox" id="pf-realism"> Realism effects</label>
          <label>Page title
            <input type="text" id="pf-title" placeholder="e.g. Physics — Ch. 4">
          </label>
        </aside>
      </div>
    `;

    this.textarea = this.container.querySelector("#pf-text");
    this.status = this.container.querySelector("#pf-status");
    this.wrap = this.container.querySelector("#pf-canvas-wrap");

    this.textarea.addEventListener("input", () => this.debounceRender());
    for (const id of ["pf-style", "pf-color", "pf-thickness", "pf-paper", "pf-realism", "pf-title"]) {
      this.container.querySelector(`#${id}`).addEventListener("input", () => this.render());
      this.container.querySelector(`#${id}`).addEventListener("change", () => this.render());
    }
    this.container.querySelector("#pf-structure").addEventListener("click", () => this.structureAI());
    this.container.querySelector("#pf-import-img").addEventListener("change", (e) => this.importImage(e));
    this.container.querySelector("#pf-export-png").addEventListener("click", () => this.exportPNG());
    this.container.querySelector("#pf-export-pdf").addEventListener("click", () => this.exportPDF());

    this.render();
  }

  collectSettings() {
    return {
      style: STYLES[this.container.querySelector("#pf-style").value],
      color: INK_COLORS[this.container.querySelector("#pf-color").value],
      thickness: parseFloat(this.container.querySelector("#pf-thickness").value),
      paper: PAPER_TYPES[this.container.querySelector("#pf-paper").value],
      realism: this.container.querySelector("#pf-realism").checked,
      title: this.container.querySelector("#pf-title").value,
      date: this.settings.date,
      seed: this.settings.seed,
    };
  }

  debounceTimer = null;
  debounceRender() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.render(), 250);
  }

  render() {
    const text = this.textarea.value;
    if (!text.trim()) {
      this.wrap.innerHTML = `<div class="pf-empty">Your handwritten page will appear here…</div>`;
      return;
    }
    const s = this.collectSettings();
    const canvases = renderNotebook(text, s);
    this.wrap.innerHTML = "";
    canvases.forEach((c) => {
      c.className = "pf-page";
      this.wrap.appendChild(c);
    });
    this.lastCanvases = canvases;
  }

  async structureAI() {
    const raw = this.textarea.value;
    if (!raw.trim()) return;
    this.status.textContent = "🤖 Structuring notes…";
    try {
      const blocks = structureNotesHeuristic(raw);
      const structured = blocks
        .map((b) => {
          switch (b.type) {
            case "heading": return `\n## ${b.text}\n`;
            case "bullet": return `• ${b.text}`;
            case "numbered": return `${blocks.filter((x) => x.type === "numbered").indexOf(b) + 1}. ${b.text}`;
            case "revisionBox": return `[${b.text}]`;
            case "formula": return `${b.text}`;
            default: return b.text;
          }
        })
        .join("\n");
      this.textarea.value = structured;
      this.status.textContent = "✅ Notes structured (offline mode). Connect an AI provider in Settings for LLM-powered structuring.";
      this.render();
    } catch (err) {
      this.status.textContent = `❌ ${err.message}`;
    }
  }

  async importImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.status.textContent = "🔍 Running OCR…";
    try {
      const { text, confidence } = await recognizeText(file, {
        onProgress: (p) => (this.status.textContent = `🔍 OCR ${Math.round(p * 100)}%…`),
      });
      this.textarea.value = text;
      this.status.textContent = `✅ OCR done (confidence ${confidence}%). Edit if needed and the preview updates live.`;
      this.render();
    } catch (err) {
      this.status.textContent = `❌ OCR failed: ${err.message}`;
    }
    event.target.value = "";
  }

  exportPNG() {
    if (!this.lastCanvases?.length) return;
    downloadPNG(this.lastCanvases[0], "penflow-page.png");
  }

  exportPDF() {
    if (!this.lastCanvases?.length) return;
    downloadPDF(this.lastCanvases, "penflow-notebook.pdf");
  }
}

/**
 * PenFlow — Canvas Composition & Export Pipeline
 *
 * Composites the paper background and handwritten strokes onto an HTML5 Canvas,
 * then exports to PNG / JPG / SVG / multipage PDF (via jsPDF when available).
 */

import { varyText, measureText, STYLES, DEFAULT_STYLE } from "./handwriting.js";
import { drawPaper, drawHeader, DEFAULT_PAPER, DEFAULT_PEN } from "./paper.js";

const CANVAS_WIDTH = 1240;   // ~A4 landscape-ish working width at 150dpi
const CANVAS_HEIGHT = 1754;  // A4 portrait at 150dpi
const BASE_FONT = 26;

/**
 * Render a block of lines as handwriting onto a fresh canvas.
 *
 * @param {object} options
 * @param {string[]} options.lines   Array of text lines
 * @param {object}   options.style   Style preset
 * @param {string}   options.color   Ink color
 * @param {number}   options.thickness Pen thickness
 * @param {number}   options.seed    Randomness seed
 * @param {boolean}  options.realism Realism effects
 * @param {object}   options.paper   Paper preset
 * @param {object}   options.header  {date, page, title}
 * @returns {HTMLCanvasElement}
 */
export function renderPage(options = {}) {
  const {
    lines = [""],
    style = DEFAULT_STYLE,
    color = DEFAULT_PEN.color,
    thickness = DEFAULT_PEN.thickness,
    seed = 0,
    realism = false,
    paper = DEFAULT_PAPER,
    header = null,
  } = options;

  const canvas = document.createElement("canvas");
  drawPaper(canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, paper, realism, pageFlip: realism });
  const ctx = canvas.getContext("2d");

  if (header) drawHeader(canvas, { paper, ...header });

  ctx.save();
  ctx.font = `italic ${BASE_FONT}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.textBaseline = "alphabetic";

  const startX = paper.margin + 16;
  let y = 60 + paper.lineHeight * (header ? 1 : 0);

  for (const line of lines) {
    if (y > CANVAS_HEIGHT - 50) break; // prevent overflow; pagination handles the rest

    const { chars } = varyText(line, style, seed + y);
    let x = startX;

    for (const c of chars) {
      if (c.ch === " ") {
        x += BASE_FONT * 0.55 * c.wordGap;
        continue;
      }

      ctx.save();
      // Position on the ruled line with baseline drift
      const glyphY = y + c.baseline;
      ctx.translate(x + BASE_FONT / 2, glyphY);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.scale(c.size * c.width, c.size);
      // Slant transform (shear)
      ctx.transform(1, 0, c.slant, 1, 0, 0);

      const penWidth = thickness * c.pressure * (1 + (c.speed - 1) * 0.2);

      // Sub-stroke for ink density realism (draw glyph twice with tiny offset)
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = penWidth;
      ctx.fillText(c.ch, -BASE_FONT / 2, 0);
      ctx.globalAlpha = 0.35;
      ctx.fillText(c.ch, -BASE_FONT / 2 + 0.4, 0.3);

      // Occasional re-trace hesitation
      if (c.retraced) {
        ctx.globalAlpha = 0.25;
        ctx.fillText(c.ch, -BASE_FONT / 2 + 0.8, -0.4);
      }
      ctx.restore();

      x += (BASE_FONT * 0.62 * c.letterGap) + c.wordGap * BASE_FONT * 0.5;

      // Occasional strikethrough correction
      if (c.corrected) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - BASE_FONT, y - BASE_FONT * 0.35);
        ctx.lineTo(x + BASE_FONT * 0.2, y - BASE_FONT * 0.35);
        ctx.stroke();
        ctx.restore();
      }
    }
    y += paper.lineHeight;
  }

  ctx.restore();
  return canvas;
}

/**
 * Paginate a text string into lines+pages given a style and paper.
 */
export function paginate(text, opts = {}) {
  const { style = DEFAULT_STYLE, paper = DEFAULT_PAPER, maxWidth = CANVAS_WIDTH - 260 } = opts;
  const paragraphs = text.split(/\r?\n/);
  const pages = [];
  let currentPage = [];
  const maxLines = Math.floor((CANVAS_HEIGHT - 130) / paper.lineHeight);
  let lineCount = 0;

  for (const para of paragraphs) {
    if (para.trim() === "") {
      currentPage.push("");
      lineCount++;
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (measureText(trial, BASE_FONT, style, 0) > maxWidth) {
        currentPage.push(line);
        lineCount++;
        line = word;
      } else {
        line = trial;
      }
    }
    if (line) {
      currentPage.push(line);
      lineCount++;
    }
    if (lineCount >= maxLines) {
      pages.push(currentPage);
      currentPage = [];
      lineCount = 0;
    }
  }
  if (currentPage.length > 0 || pages.length === 0) pages.push(currentPage);
  return pages;
}

/**
 * Render a full notebook (multi-page) from plain text.
 * @returns {HTMLCanvasElement[]}
 */
export function renderNotebook(text, opts = {}) {
  const { style = DEFAULT_STYLE, color, thickness, realism, paper, seed = 42 } = opts;
  const pages = paginate(text, { style, paper });
  return pages.map((lines, i) =>
    renderPage({
      lines, style, color, thickness,
      seed: seed + i * 1000,
      realism, paper,
      header: { page: i + 1, date: opts.date || null, title: opts.title || null },
    })
  );
}

/**
 * Export canvases to a downloadable PNG.
 */
export function downloadPNG(canvas, filename = "penflow-page.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * Export canvases to a merged multipage PDF (requires jsPDF global).
 */
export function downloadPDF(canvases, filename = "penflow-notebook.pdf") {
  if (typeof window.jspdf === "undefined") {
    console.warn("jsPDF not loaded; falling back to single-page PNG.");
    downloadPNG(canvases[0], filename.replace(".pdf", "-page-1.png"));
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "px", format: [CANVAS_WIDTH, CANVAS_HEIGHT] });
  canvases.forEach((c, i) => {
    if (i > 0) doc.addPage([CANVAS_WIDTH, CANVAS_HEIGHT]);
    doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  });
  doc.save(filename);
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_FONT };

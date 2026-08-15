/**
 * PenFlow — Paper Template & Background Renderer
 *
 * Draws authentic notebook paper backgrounds (ruled, graph, blank, engineering,
 * double-ruled, A4) onto a canvas layer, with optional realism effects.
 */

export const PAPER_TYPES = {
  a4Ruled: { name: "A4 Ruled", lineHeight: 34, margin: 90 },
  singleRuled: { name: "Single Line Ruled", lineHeight: 30, margin: 80 },
  doubleRuled: { name: "Double Line Ruled", lineHeight: 34, margin: 85 },
  graph: { name: "Graph Paper", lineHeight: 24, margin: 70 },
  blank: { name: "Blank Sheet", lineHeight: 34, margin: 80 },
  engineering: { name: "Engineering Paper", lineHeight: 30, margin: 95 },
};

export const DEFAULT_PAPER = PAPER_TYPES.a4Ruled;

export const INK_COLORS = {
  blue: "#1a3fa0",
  black: "#1c1c1e",
  red: "#b02525",
  green: "#1e6b3a",
};

export const DEFAULT_PEN = { color: INK_COLORS.blue, thickness: 1.6 };

/**
 * Render a paper background onto the given canvas.
 */
export function drawPaper(canvas, opts = {}) {
  const paper = opts.paper || DEFAULT_PAPER;
  const {
    width, height,
    realism = false,
    pageFlip = false,
  } = opts;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Base paper color (slightly warm off-white)
  ctx.fillStyle = "#fdfbf5";
  ctx.fillRect(0, 0, width, height);

  // Subtle fiber noise
  ctx.save();
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < width * height / 900; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#8a8272";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();

  const m = paper.margin;

  // Ruled lines
  ctx.strokeStyle = "rgba(150, 190, 230, 0.55)";
  ctx.lineWidth = 1;
  for (let y = 60; y < height - 40; y += paper.lineHeight) {
    if (paper === PAPER_TYPES.doubleRuled) {
      ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(width - 40, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m, y + 4); ctx.lineTo(width - 40, y + 4); ctx.stroke();
    } else if (paper === PAPER_TYPES.graph) {
      ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(width - 40, y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(width - 40, y); ctx.stroke();
    }
  }

  // Vertical grid for graph paper
  if (paper === PAPER_TYPES.graph) {
    ctx.beginPath();
    for (let x = m; x < width - 40; x += paper.lineHeight) {
      ctx.moveTo(x, 60); ctx.lineTo(x, height - 40);
    }
    ctx.stroke();
  }

  // Red margin line
  ctx.strokeStyle = "rgba(220, 90, 90, 0.65)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, 60);
  ctx.lineTo(m, height - 40);
  ctx.stroke();

  // Engineering paper: heavier grid
  if (paper === PAPER_TYPES.engineering) {
    ctx.strokeStyle = "rgba(120, 160, 200, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = m; x < width - 40; x += paper.lineHeight * 5) {
      ctx.moveTo(x, 60); ctx.lineTo(x, height - 40);
    }
    for (let y = 60; y < height - 40; y += paper.lineHeight * 5) {
      ctx.moveTo(m, y); ctx.lineTo(width - 40, y);
    }
    ctx.stroke();
  }

  // Realism pack
  if (realism) {
    // Vignette / page-edge shadow
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) / 3,
      width / 2, height / 2, Math.max(width, height) / 1.1
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Page-curl gradient at bottom-right corner
    if (pageFlip) {
      const curl = ctx.createRadialGradient(width - 30, height - 30, 5, width - 30, height - 30, 120);
      curl.addColorStop(0, "rgba(180,170,150,0.45)");
      curl.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = curl;
      ctx.fillRect(0, 0, width, height);
    }

    // Fold line (horizontal, mid-page)
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = "#8a8272";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.restore();
  }

  return ctx;
}

/**
 * Draw a header (date / title / page number) in a lighter pencil style.
 */
export function drawHeader(canvas, opts = {}) {
  const ctx = canvas.getContext("2d");
  const paper = opts.paper || DEFAULT_PAPER;
  ctx.save();
  ctx.font = "italic 16px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(60, 60, 60, 0.75)";
  if (opts.date) ctx.fillText(opts.date, paper.margin + 10, 40);
  if (opts.page) {
    const t = `${opts.page}`;
    ctx.fillText(t, canvas.width - 70, 40);
  }
  if (opts.title) {
    ctx.font = "bold 22px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(40, 40, 40, 0.9)";
    ctx.fillText(opts.title, paper.margin + 10, 40);
  }
  ctx.restore();
}

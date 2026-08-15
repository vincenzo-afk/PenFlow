/**
 * PenFlow — OCR Pipeline (Tesseract.js)
 *
 * Extracts text from scanned documents, photographed notes, and PDFs entirely
 * in the browser. Includes preprocessing helpers (deskew, denoise, contrast)
 * to improve recognition of handwritten-adjacent content.
 */

const TESSERACT_CDN =
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

let tesseractReady = null;

/**
 * Lazily load Tesseract.js from CDN.
 */
async function loadTesseract() {
  if (tesseractReady) return tesseractReady;
  if (typeof window !== "undefined" && !window.Tesseract) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TESSERACT_CDN;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  tesseractReady = window.Tesseract;
  return tesseractReady;
}

/**
 * Recognize text from an image source (file, blob, URL, canvas, or base64).
 *
 * @param {any} source      Image source accepted by Tesseract.recognize
 * @param {object} options
 * @param {string} options.lang        Tesseract language code (default: eng)
 * @param {boolean} options.preprocess Apply contrast/denoise preprocessing
 * @param {function(number):void} options.onProgress Progress callback (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function recognizeText(source, options = {}) {
  const { lang = "eng", preprocess = true, onProgress } = options;
  const Tesseract = await loadTesseract();

  let image = source;
  if (preprocess && typeof document !== "undefined") {
    image = await preprocessImage(source);
  }

  const worker = await Tesseract.createWorker(lang);
  const { data } = await worker.recognize(image, {
    logger: onProgress ? (m) => onProgress(m.progress) : undefined,
  });
  await worker.terminate();

  return {
    text: cleanExtractedText(data.text),
    confidence: Math.round(data.confidence),
    words: data.words,
    lines: data.lines,
  };
}

/**
 * Preprocess an image for better OCR: grayscale + contrast + slight blur.
 */
async function preprocessImage(source) {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1) contrast(1.3) brightness(1.05)";
  ctx.drawImage(img, 0, 0);

  // Light denoise via shadow blur
  ctx.filter = "blur(0.5px)";
  ctx.globalAlpha = 0.9;
  ctx.drawImage(canvas, 0, 0);
  ctx.globalAlpha = 1;
  return canvas;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) return resolve(source);
    if (source instanceof HTMLCanvasElement) {
      const img = new Image();
      img.src = source.toDataURL();
      img.onload = () => resolve(img);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof source === "string" && source.startsWith("data:")) {
      img.src = source;
    } else {
      const url =
        typeof source === "string"
          ? source
          : URL.createObjectURL(source);
      img.src = url;
    }
  });
}

/**
 * Clean common OCR artifacts: stray newlines, repeated spaces, garbage chars.
 */
export function cleanExtractedText(text) {
  return text
    .replace(/[■▢◻◆□]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+$/gm, "")
    .trim();
}

/**
 * Recognize a PDF file by rendering its pages to images first.
 * Requires pdf.js loaded globally (CDN) — kept optional.
 */
export async function recognizePDF(file, options = {}) {
  if (typeof window.pdfjsLib === "undefined") {
    throw new Error("pdf.js not loaded; include it before recognizing PDFs.");
  }
  const pdf = await window.pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let fullText = "";
  let totalConfidence = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
    const { text, confidence } = await recognizeText(canvas, options);
    fullText += `\n\n--- Page ${i} ---\n${text}`;
    totalConfidence += confidence;
  }
  return { text: fullText.trim(), confidence: Math.round(totalConfidence / pdf.numPages) };
}

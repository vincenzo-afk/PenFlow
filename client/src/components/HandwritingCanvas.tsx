/**
 * Field Notebook Atelier component: the generated paper remains the focal point;
 * warm ruled stock, indigo ink, and a restrained vermilion margin create PenFlow's tactile editor identity.
 */
import { useEffect } from "react";

export type PaperKind = "ruled" | "graph" | "dot" | "blank";
export type HandwritingStyle = "scholar" | "quick" | "cursive" | "blueprint";
export type InkColor = "indigo" | "black" | "vermilion" | "forest";

type HandwritingCanvasProps = {
  text: string;
  title: string;
  paper: PaperKind;
  handwriting: HandwritingStyle;
  ink: InkColor;
  thickness: number;
  realism: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

const inkMap: Record<InkColor, string> = {
  indigo: "#1b3d81",
  black: "#1d222b",
  vermilion: "#b94232",
  forest: "#1e6046",
};

const hash = (input: string) => {
  let total = 981723;
  for (let index = 0; index < input.length; index += 1) {
    total = ((total << 5) - total + input.charCodeAt(index)) | 0;
  }
  return total;
};

const nextRandom = (state: { value: number }) => {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value / 4294967296;
};

function writeCharacter(
  ctx: CanvasRenderingContext2D,
  character: string,
  x: number,
  y: number,
  fontSize: number,
  style: HandwritingStyle,
  random: { value: number },
  thickness: number,
  color: string,
) {
  const variation = style === "quick" ? 1.2 : style === "cursive" ? 0.85 : 0.52;
  const baseline = (nextRandom(random) - 0.5) * variation * 2;
  const tilt = (nextRandom(random) - 0.5) * variation * 0.033;
  const scaleY = 0.97 + nextRandom(random) * 0.065;
  const scaleX = 0.985 + nextRandom(random) * 0.045;

  ctx.save();
  ctx.translate(x, y + baseline);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.87 + nextRandom(random) * 0.1;
  ctx.fillText(character, 0, 0);
  if (thickness > 1.7 && character.trim()) {
    ctx.globalAlpha = 0.11 + thickness * 0.025;
    ctx.fillText(character, 0.48, 0.24);
  }
  ctx.restore();
}

function drawPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paper: PaperKind,
  random: { value: number },
  realism: boolean,
) {
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.048;
  for (let index = 0; index < 1550; index += 1) {
    const x = nextRandom(random) * width;
    const y = nextRandom(random) * height;
    const shade = 181 + Math.round(nextRandom(random) * 35);
    ctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 25})`;
    ctx.fillRect(x, y, nextRandom(random) * 1.3, nextRandom(random) * 1.3);
  }
  ctx.restore();

  if (paper !== "blank") {
    ctx.save();
    ctx.strokeStyle = paper === "dot" ? "rgba(113,142,173,.35)" : "rgba(124,163,205,.40)";
    ctx.lineWidth = 0.8;
    const step = paper === "graph" ? 26 : paper === "dot" ? 22 : 33;

    if (paper === "dot") {
      for (let y = 112; y < height - 65; y += step) {
        for (let x = 82; x < width - 55; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(124,163,205,.45)";
          ctx.fill();
        }
      }
    } else {
      for (let y = 112; y < height - 65; y += step) {
        ctx.beginPath();
        ctx.moveTo(58, y);
        ctx.lineTo(width - 48, y);
        ctx.stroke();
      }
      if (paper === "graph") {
        for (let x = 82; x < width - 48; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 68);
          ctx.lineTo(x, height - 65);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "rgba(216,74,56,.60)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(88, 67);
  ctx.lineTo(88, height - 65);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(width - 44, 0);
  ctx.lineTo(width, 44);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(239,232,219,.96)";
  ctx.fill();
  ctx.strokeStyle = "rgba(137,111,82,.22)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width - 44, 0);
  ctx.lineTo(width - 44, 44);
  ctx.lineTo(width, 44);
  ctx.strokeStyle = "rgba(255,255,255,.58)";
  ctx.stroke();
  ctx.restore();

  if (realism) {
    const edge = ctx.createRadialGradient(width / 2, height / 2, width * 0.22, width / 2, height / 2, width * 0.72);
    edge.addColorStop(0, "rgba(90,65,42,0)");
    edge.addColorStop(1, "rgba(90,65,42,.11)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(119,94,68,.075)";
    ctx.beginPath();
    ctx.moveTo(30, height * 0.54);
    ctx.lineTo(width - 32, height * 0.545);
    ctx.stroke();
  }
}

function splitIntoDisplayLines(text: string, ctx: CanvasRenderingContext2D, maxWidth: number, fontSize: number) {
  const output: Array<{ content: string; kind: "heading" | "body" | "bullet" | "spacer" }> = [];
  const rawLines = text.split(/\r?\n/);
  rawLines.forEach((raw) => {
    const cleaned = raw.trim();
    if (!cleaned) {
      output.push({ content: "", kind: "spacer" });
      return;
    }
    const isHeading = cleaned.startsWith("# ") || cleaned === cleaned.toUpperCase() && cleaned.length < 48;
    const isBullet = /^[-•*]\s/.test(cleaned);
    const content = cleaned.replace(/^#\s|^[-•*]\s/, "");
    const kind = isHeading ? "heading" : isBullet ? "bullet" : "body";
    const words = content.split(/\s+/);
    let line = kind === "bullet" ? "• " : "";
    words.forEach((word) => {
      const next = line ? `${line}${line === "• " ? "" : " "}${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line.trim() !== "•") {
        output.push({ content: line, kind });
        line = kind === "bullet" ? `  ${word}` : word;
      } else {
        line = next;
      }
    });
    if (line) output.push({ content: line, kind });
  });
  return output;
}

export function HandwritingCanvas({
  text,
  title,
  paper,
  handwriting,
  ink,
  thickness,
  realism,
  canvasRef,
}: HandwritingCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 760;
    const height = 1074;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.aspectRatio = `${width}/${height}`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const random = { value: Math.abs(hash(`${title}${text}${paper}${handwriting}${ink}`)) };
    drawPaper(ctx, width, height, paper, random, realism);

    const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());
    ctx.fillStyle = "rgba(27,36,50,.56)";
    ctx.font = "600 11px 'DM Mono', monospace";
    ctx.fillText(date.toUpperCase(), 109, 50);
    ctx.textAlign = "right";
    ctx.fillText("PENFLOW / 01", width - 56, 50);
    ctx.textAlign = "left";

    const titleFont = handwriting === "blueprint" ? "600 23px 'DM Mono', monospace" : "600 29px 'Kalam', cursive";
    ctx.font = titleFont;
    ctx.fillStyle = inkMap[ink];
    ctx.fillText(title || "Untitled note", 108, 93);
    ctx.strokeStyle = "rgba(216,74,56,.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(108, 102);
    ctx.lineTo(width - 58, 102);
    ctx.stroke();

    const family = handwriting === "blueprint" ? "'DM Mono', monospace" : handwriting === "cursive" ? "'Caveat', cursive" : "'Kalam', cursive";
    const fontSize = handwriting === "quick" ? 24 : handwriting === "cursive" ? 27 : handwriting === "blueprint" ? 18 : 23;
    ctx.font = `${fontSize}px ${family}`;
    const lines = splitIntoDisplayLines(text || "Begin writing in the editor to make your first paper.", ctx, width - 178, fontSize);
    let y = 145;
    const lineHeight = handwriting === "quick" ? 31 : 34;

    for (const line of lines) {
      if (y > height - 72) break;
      if (line.kind === "spacer") {
        y += lineHeight * 0.55;
        continue;
      }
      const size = line.kind === "heading" ? fontSize + 5 : fontSize;
      ctx.font = `${line.kind === "heading" ? "600" : "400"} ${size}px ${family}`;
      let x = line.kind === "bullet" ? 115 : 109;
      for (const character of line.content) {
        const charWidth = ctx.measureText(character).width;
        if (character === " ") {
          x += charWidth * (0.88 + nextRandom(random) * 0.15);
        } else {
          writeCharacter(ctx, character, x, y, size, handwriting, random, thickness, inkMap[ink]);
          x += charWidth * (0.91 + nextRandom(random) * 0.1);
        }
      }
      y += lineHeight + (line.kind === "heading" ? 7 : 0);
    }

    ctx.save();
    ctx.fillStyle = "rgba(27,36,50,.40)";
    ctx.font = "10px 'DM Mono', monospace";
    ctx.fillText("PENFLOW / MADE FOR REVISION", 109, height - 38);
    ctx.textAlign = "right";
    ctx.fillText("Generated locally", width - 56, height - 38);
    ctx.restore();
  }, [canvasRef, handwriting, ink, paper, realism, text, thickness, title]);

  return <canvas ref={canvasRef} aria-label="Generated handwritten note preview" className="note-canvas" />;
}

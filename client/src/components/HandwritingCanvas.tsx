/**
 * Field Notebook Atelier renderer: text stays semantic while page, pen, imperfection,
 * correction, and annotation layers are drawn locally into one or more paper canvases.
 */
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { DEFAULT_APPEARANCE, mergeAppearance, type DocumentAppearance, type HandwritingStyle, type PaperKind, type TextMark } from "@/lib/appearance";
import { drawStroke, type InkStroke } from "@/lib/drawing";

export type { HandwritingStyle, PaperKind } from "@/lib/appearance";
export type InkColor = "indigo" | "black" | "vermilion" | "forest";

type HandwritingCanvasProps = {
  text: string;
  title: string;
  appearance?: DocumentAppearance;
  marks?: TextMark[];
  drawings?: Record<number, InkStroke[]>;
  pageIndex?: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPageCount?: (count: number) => void;
  /* Legacy props keep older notes/components compatible while the studio is upgraded. */
  paper?: PaperKind;
  handwriting?: HandwritingStyle;
  ink?: InkColor;
  thickness?: number;
  realism?: boolean;
};

type RandomState = { value: number };
type DisplayLine = { content: string; kind: "heading" | "body" | "bullet" | "spacer"; indent: number };
type RenderInput = { text: string; title: string; appearance: DocumentAppearance; marks: TextMark[]; drawings?: Record<number, InkStroke[]> };

const PAGE_WIDTH = 760;
const PAGE_HEIGHT = 1074;
const inkMap: Record<InkColor, string> = { indigo: "#1b3d81", black: "#1d222b", vermilion: "#b94232", forest: "#1e6046" };
const paperFill: Record<DocumentAppearance["paper"]["shade"], string> = { ivory: "#fffdf7", white: "#fffefd", cream: "#f9f1dc", blue: "#f2f7fc", recycled: "#efe5ce" };

const hash = (input: string) => {
  let total = 981723;
  for (let index = 0; index < input.length; index += 1) total = ((total << 5) - total + input.charCodeAt(index)) | 0;
  return total;
};
const random = (state: RandomState) => { state.value = (state.value * 1664525 + 1013904223) >>> 0; return state.value / 4294967296; };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const legacyAppearance = (props: HandwritingCanvasProps) => mergeAppearance({
  pen: { ...DEFAULT_APPEARANCE.pen, color: props.ink ? inkMap[props.ink] : DEFAULT_APPEARANCE.pen.color, nib: props.thickness ?? DEFAULT_APPEARANCE.pen.nib },
  handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: props.handwriting ?? DEFAULT_APPEARANCE.handwriting.style },
  paper: { ...DEFAULT_APPEARANCE.paper, kind: props.paper ?? DEFAULT_APPEARANCE.paper.kind },
  humanize: { ...DEFAULT_APPEARANCE.humanize, enabled: props.realism ?? DEFAULT_APPEARANCE.humanize.enabled },
});

const familyFor = (style: HandwritingStyle) => {
  if (style === "blueprint") return "'DM Mono', monospace";
  if (style === "cursive") return "'Caveat', cursive";
  if (style === "rounded") return "'Kalam', cursive";
  if (style === "caps") return "'DM Mono', monospace";
  return "'Kalam', cursive";
};

const normalizeContent = (content: string, capitals: DocumentAppearance["handwriting"]["capitals"]) => {
  if (capitals === "upper") return content.toUpperCase();
  if (capitals === "sentence") return content.replace(/(^|[.!?]\s+)([a-z])/g, (_match, lead, letter) => `${lead}${letter.toUpperCase()}`);
  return content;
};

function writeCharacter(ctx: CanvasRenderingContext2D, char: string, x: number, y: number, size: number, appearance: DocumentAppearance, rng: RandomState) {
  const { pen, handwriting, humanize } = appearance;
  const human = humanize.enabled && !humanize.cleanView ? humanize.amount : 0;
  const variation = (handwriting.baselineDrift + handwriting.tremor) * (0.2 + human);
  const baseline = (random(rng) - .5) * variation * 3.2;
  const tilt = (pen.slant * Math.PI / 180) + (random(rng) - .5) * (handwriting.tremor + human) * .025;
  const scaleX = 1 + (random(rng) - .5) * (0.025 + human * .06);
  const scaleY = 1 + (random(rng) - .5) * (0.018 + human * .05);
  const pressure = 1 + (random(rng) - .5) * pen.pressure * .17;
  const alpha = clamp(pen.opacity * (.86 + random(rng) * .14) * (.74 + pen.flow * .26), .16, 1);

  ctx.save();
  ctx.translate(x, y + baseline);
  ctx.rotate(tilt);
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = pen.color;
  ctx.globalAlpha = alpha;
  if (pen.bleed > .01) { ctx.shadowColor = pen.color; ctx.shadowBlur = pen.bleed * 2.5; }
  ctx.fillText(char, 0, 0);
  if (pen.kind === "fountain" || pen.kind === "felt" || pen.nib > 1.65) {
    ctx.globalAlpha = clamp(alpha * (.12 + pen.pressure * .14), .04, .26);
    ctx.fillText(char, .25 * pressure, .14 * pressure);
  }
  if (pen.kind === "pencil") {
    ctx.globalAlpha = .14 + random(rng) * .12;
    ctx.fillText(char, -.34, .18);
  }
  ctx.restore();
}

function drawPaper(ctx: CanvasRenderingContext2D, width: number, height: number, appearance: DocumentAppearance, rng: RandomState) {
  const { paper } = appearance;
  ctx.fillStyle = paperFill[paper.shade];
  ctx.fillRect(0, 0, width, height);

  const grainCount = Math.round(160 + paper.texture * 1500);
  ctx.save();
  ctx.globalAlpha = .015 + paper.texture * .055;
  for (let index = 0; index < grainCount; index += 1) {
    const x = random(rng) * width; const y = random(rng) * height; const shade = 164 + Math.round(random(rng) * 55);
    ctx.fillStyle = `rgb(${shade}, ${Math.max(0, shade - 8)}, ${Math.max(0, shade - 23)})`;
    ctx.fillRect(x, y, random(rng) * 1.1, random(rng) * 1.1);
  }
  ctx.restore();

  const bodyTop = 114; const bodyBottom = height - 67; const left = paper.binding === "spiral" ? 90 : 58; const right = width - 48;
  const lineColor = paper.ruleColor; const rule = paper.ruleWeight;
  ctx.save(); ctx.strokeStyle = lineColor; ctx.globalAlpha = .42; ctx.lineWidth = rule;
  const kind = paper.kind;
  const horizontalStep = kind === "narrow" ? 25 : 33;
  if (kind === "dot") {
    for (let y = bodyTop; y < bodyBottom; y += 22) for (let x = left + 25; x < right; x += 22) { ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fillStyle = lineColor; ctx.fill(); }
  } else if (kind === "music") {
    for (let y = bodyTop; y < bodyBottom; y += 92) for (let line = 0; line < 5; line += 1) { ctx.beginPath(); ctx.moveTo(left, y + line * 8); ctx.lineTo(right, y + line * 8); ctx.stroke(); }
  } else if (kind !== "blank" && kind !== "flashcard") {
    const step = kind === "graph" ? 26 : horizontalStep;
    for (let y = bodyTop; y < bodyBottom; y += step) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
    if (kind === "graph") for (let x = left; x < right; x += 26) { ctx.beginPath(); ctx.moveTo(x, 68); ctx.lineTo(x, bodyBottom); ctx.stroke(); }
  }
  if (kind === "cornell") { ctx.beginPath(); ctx.moveTo(220, bodyTop); ctx.lineTo(220, bodyBottom); ctx.stroke(); ctx.beginPath(); ctx.moveTo(left, height - 178); ctx.lineTo(right, height - 178); ctx.stroke(); }
  if (kind === "planner") { for (let y = bodyTop; y < bodyBottom; y += 136) { ctx.strokeRect(left, y, right-left, 112); } }
  if (kind === "lab") { ctx.strokeRect(left, bodyTop, right-left, bodyBottom-bodyTop); ctx.beginPath(); ctx.moveTo(left + 125, bodyTop); ctx.lineTo(left + 125, bodyBottom); ctx.stroke(); }
  if (kind === "flashcard") { ctx.globalAlpha = .6; ctx.strokeStyle = "#d94a38"; ctx.strokeRect(88, 160, width - 176, height - 320); }
  ctx.restore();

  if (paper.margin !== "none") {
    const x = paper.margin === "right" ? width - 89 : 88;
    ctx.save(); ctx.strokeStyle = "rgba(216,74,56,.72)"; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.moveTo(x, 67); ctx.lineTo(x, height - 65); ctx.stroke(); ctx.restore();
  }
  if (paper.binding === "holes") {
    ctx.save(); ctx.fillStyle = "rgba(63,57,47,.12)"; for (let y = 142; y < height - 86; y += 112) { ctx.beginPath(); ctx.arc(34, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(34, y, 4.2, 0, Math.PI * 2); ctx.fillStyle = paperFill[paper.shade]; ctx.fill(); ctx.fillStyle = "rgba(63,57,47,.12)"; } ctx.restore();
  }
  if (paper.binding === "spiral") {
    ctx.save(); ctx.strokeStyle = "rgba(49,59,72,.35)"; ctx.lineWidth = 1.4; for (let y = 92; y < height - 70; y += 36) { ctx.beginPath(); ctx.arc(57, y, 10, Math.PI*.35, Math.PI*1.65); ctx.stroke(); } ctx.restore();
  }
  if (paper.fold) { ctx.save(); ctx.beginPath(); ctx.moveTo(width - 44, 0); ctx.lineTo(width, 44); ctx.lineTo(width, 0); ctx.closePath(); ctx.fillStyle = "rgba(235,228,214,.96)"; ctx.fill(); ctx.strokeStyle = "rgba(137,111,82,.2)"; ctx.stroke(); ctx.restore(); }
  if (paper.texture > .25) { const edge = ctx.createRadialGradient(width/2,height/2,width*.22,width/2,height/2,width*.72); edge.addColorStop(0,"rgba(90,65,42,0)"); edge.addColorStop(1,`rgba(90,65,42,${paper.texture*.14})`); ctx.fillStyle=edge;ctx.fillRect(0,0,width,height); }
}

function splitLines(text: string, ctx: CanvasRenderingContext2D, maxWidth: number, appearance: DocumentAppearance): DisplayLine[] {
  const output: DisplayLine[] = []; const rawLines = text.split(/\r?\n/);
  for (let rawIndex = 0; rawIndex < rawLines.length; rawIndex += 1) {
    const clean = rawLines[rawIndex].trim();
    if (!clean) { output.push({ content: "", kind: "spacer", indent: 0 }); continue; }
    const heading = clean.startsWith("# ") || (clean === clean.toUpperCase() && clean.length < 48);
    const bullet = /^[-•*]\s/.test(clean); const content = normalizeContent(clean.replace(/^#\s|^[-•*]\s/, ""), appearance.handwriting.capitals);
    const kind: DisplayLine["kind"] = heading ? "heading" : bullet ? "bullet" : "body";
    const words = content.split(/\s+/); let line = bullet ? "• " : "";
    for (let wordIndex = 0; wordIndex < words.length; wordIndex += 1) {
      const word = words[wordIndex]; const candidate = line ? `${line}${line === "• " ? "" : " "}${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line.trim() !== "•") { output.push({ content: line, kind, indent: bullet ? 9 : 0 }); line = bullet ? `  ${word}` : word; } else line = candidate;
    }
    if (line) output.push({ content: line, kind, indent: bullet ? 9 : 0 });
  }
  return output;
}

function paginate(lines: DisplayLine[], appearance: DocumentAppearance) {
  const pages: DisplayLine[][] = [[]]; let cursor = 145; const baseHeight = appearance.handwriting.size * appearance.handwriting.lineHeight;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]; const height = line.kind === "spacer" ? baseHeight*.55 : baseHeight + (line.kind === "heading" ? 9 : 0);
    if (cursor + height > PAGE_HEIGHT - 78 && pages[pages.length-1].length) { pages.push([]); cursor = 145; }
    pages[pages.length-1].push(line); cursor += height;
  }
  return pages;
}

function drawMark(ctx: CanvasRenderingContext2D, line: DisplayLine, x: number, y: number, size: number, mark: TextMark, appearance: DocumentAppearance, rng: RandomState) {
  const location = line.content.toLocaleLowerCase().indexOf(mark.target.toLocaleLowerCase()); if (location < 0 || !mark.target) return;
  const prior = line.content.slice(0, location); const start = x + ctx.measureText(prior).width; const width = Math.max(ctx.measureText(mark.target).width, 14); const color = mark.color || appearance.corrections.color;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = .72; ctx.lineWidth = 1.1 + appearance.pen.nib*.18;
  if (mark.kind === "highlight") { ctx.globalAlpha = .23; ctx.fillRect(start-2,y-size*.72,width+4,size*.88); }
  if (mark.kind === "underline" || mark.kind === "doubleUnderline") { for (let lineIndex=0; lineIndex<(mark.kind === "doubleUnderline"?2:1); lineIndex+=1){ctx.beginPath();ctx.moveTo(start,y+4+lineIndex*4);ctx.quadraticCurveTo(start+width*.5,y+5+lineIndex*4+(random(rng)-.5)*1.8,start+width,y+4+lineIndex*4);ctx.stroke();} }
  if (mark.kind === "strike") { ctx.beginPath();ctx.moveTo(start,y-size*.36);ctx.lineTo(start+width,y-size*.43+(random(rng)-.5)*2);ctx.stroke(); }
  if (mark.kind === "scribble") { for(let scribble=0;scribble<3;scribble+=1){ctx.beginPath();ctx.moveTo(start,y-size*.35+scribble*2); for(let sx=start;sx<start+width;sx+=7){ctx.lineTo(sx+4,y-size*.38+scribble*2+(random(rng)-.5)*7);}ctx.stroke();} }
  if (mark.kind === "circle") { ctx.beginPath();ctx.ellipse(start+width/2,y-size*.38,width/2+7,size*.7,0,0,Math.PI*2);ctx.stroke(); }
  if (mark.kind === "bracket") { ctx.beginPath();ctx.moveTo(start-5,y-size*.74);ctx.lineTo(start-9,y-size*.74);ctx.lineTo(start-9,y+5);ctx.lineTo(start-5,y+5);ctx.moveTo(start+width+5,y-size*.74);ctx.lineTo(start+width+9,y-size*.74);ctx.lineTo(start+width+9,y+5);ctx.lineTo(start+width+5,y+5);ctx.stroke(); }
  if (mark.kind === "arrow") { ctx.beginPath();ctx.moveTo(start+width+32,y-size*.2);ctx.lineTo(start+width+4,y-size*.2);ctx.lineTo(start+width+11,y-size*.45);ctx.moveTo(start+width+4,y-size*.2);ctx.lineTo(start+width+11,y+2);ctx.stroke(); }
  ctx.restore();
}

function drawCorrections(ctx: CanvasRenderingContext2D, appearance: DocumentAppearance, rng: RandomState, page: number) {
  const { humanize, corrections, paper } = appearance; if (!humanize.enabled || humanize.cleanView || (humanize.typoRate <= .001 && humanize.repeatRate <= .001)) return;
  const chance = clamp(humanize.typoRate + humanize.repeatRate, 0, .11); if (random(rng) > chance * 5 || page > 0) return;
  const y = 210 + random(rng)*230; const x = paper.margin === "left" ? 115 + random(rng)*180 : 90 + random(rng)*200; const width = 35 + random(rng)*70;
  ctx.save();ctx.strokeStyle=corrections.color;ctx.globalAlpha=corrections.opacity;ctx.lineWidth=1.2;
  if(corrections.kind === "scribble"){for(let line=0;line<3;line+=1){ctx.beginPath();ctx.moveTo(x,y+line*3);ctx.lineTo(x+width,y+(random(rng)-.5)*7);ctx.stroke();}}
  else if(corrections.kind === "double"){for(let line=0;line<2;line+=1){ctx.beginPath();ctx.moveTo(x,y+line*4);ctx.lineTo(x+width,y-3+line*4);ctx.stroke();}}
  else if(corrections.kind === "whiteout"){ctx.fillStyle="#fffdf7";ctx.globalAlpha=.9;ctx.fillRect(x,y-15,width,18);}
  else if(corrections.kind === "caret"){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y-10);ctx.lineTo(x+10,y);ctx.stroke();}
  else if(corrections.kind === "margin"){ctx.beginPath();ctx.moveTo(92,y-17);ctx.lineTo(x,y-17);ctx.stroke();ctx.font="12px 'Kalam',cursive";ctx.fillStyle=corrections.color;ctx.fillText("rev",96,y-22);}
  else {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y-3);ctx.stroke();}ctx.restore();
}

function renderPage(canvas: HTMLCanvasElement, lines: DisplayLine[], pageNumber: number, total: number, input: RenderInput) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = PAGE_WIDTH*ratio; canvas.height=PAGE_HEIGHT*ratio; canvas.style.aspectRatio=`${PAGE_WIDTH}/${PAGE_HEIGHT}`;
  const ctx=canvas.getContext("2d");if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);
  const rng:RandomState={value:Math.abs(hash(`${input.title}/${input.text}/${JSON.stringify(input.appearance)}/${pageNumber}`))}; drawPaper(ctx,PAGE_WIDTH,PAGE_HEIGHT,input.appearance,rng);
  const date=new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(new Date());ctx.fillStyle="rgba(27,36,50,.56)";ctx.font="600 11px 'DM Mono',monospace";ctx.fillText(date.toUpperCase(),109,50);ctx.textAlign="right";ctx.fillText(`PENFLOW / ${String(pageNumber+1).padStart(2,"0")}`,PAGE_WIDTH-56,50);ctx.textAlign="left";
  const appearance=input.appearance;const style=appearance.handwriting.style;const family=familyFor(style);const titleFont=style==="blueprint"||style==="caps"?"600 22px 'DM Mono',monospace":"600 29px 'Kalam',cursive";ctx.font=titleFont;ctx.fillStyle=appearance.pen.color;ctx.fillText(pageNumber?`${input.title} — continued`:input.title||"Untitled note",109,93);ctx.strokeStyle="rgba(216,74,56,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(109,102);ctx.lineTo(PAGE_WIDTH-58,102);ctx.stroke();
  let y=145;const baseSize=appearance.handwriting.size;const baseHeight=baseSize*appearance.handwriting.lineHeight;for(let index=0;index<lines.length;index+=1){const line=lines[index];if(line.kind==="spacer"){y+=baseHeight*.55;continue;}const size=line.kind==="heading"?baseSize+5:baseSize;ctx.font=`${line.kind==="heading"?"600":"400"} ${size}px ${family}`;const left=appearance.paper.margin==="left"?109:75;let x=left+line.indent;const content=normalizeContent(line.content,appearance.handwriting.capitals);for(let charIndex=0;charIndex<content.length;charIndex+=1){const char=content.charAt(charIndex);const charWidth=ctx.measureText(char).width;if(char===" "){x+=charWidth*(.9+appearance.handwriting.wordSpacing*.12+(random(rng)-.5)*.11);}else{writeCharacter(ctx,char,x,y,size,appearance,rng);x+=charWidth*(.92+appearance.handwriting.letterSpacing*.035+(random(rng)-.5)*(appearance.humanize.enabled&&!appearance.humanize.cleanView?appearance.humanize.amount*.09:.02));}}for(let markIndex=0;markIndex<input.marks.length;markIndex+=1)drawMark(ctx,{...line,content},left+line.indent,y,size,input.marks[markIndex],appearance,rng);y+=baseHeight+(line.kind==="heading"?9:0);}
  drawCorrections(ctx,appearance,rng,pageNumber);for(const stroke of input.drawings?.[pageNumber]??[])drawStroke(ctx,stroke);ctx.save();ctx.fillStyle="rgba(27,36,50,.4)";ctx.font="10px 'DM Mono',monospace";ctx.fillText("PENFLOW / MADE FOR REVISION",109,PAGE_HEIGHT-38);ctx.textAlign="right";ctx.fillText(`${pageNumber+1} / ${total}`,PAGE_WIDTH-56,PAGE_HEIGHT-38);ctx.restore();
}

export function createDocumentCanvases(input: RenderInput) {
  const measure=document.createElement("canvas");const context=measure.getContext("2d");if(!context)return[];const family=familyFor(input.appearance.handwriting.style);context.font=`${input.appearance.handwriting.size}px ${family}`;const lines=splitLines(input.text||"Begin writing in the editor to make your first paper.",context,PAGE_WIDTH-178,input.appearance);const pages=paginate(lines,input.appearance);const results:HTMLCanvasElement[]=[];for(let index=0;index<pages.length;index+=1){const canvas=document.createElement("canvas");renderPage(canvas,pages[index],index,pages.length,input);results.push(canvas);}return results;
}

export function HandwritingCanvas(props: HandwritingCanvasProps) {
  const { canvasRef, text, title, marks = [], drawings = {}, pageIndex = 0, onPageCount } = props; const appearance = props.appearance ?? legacyAppearance(props);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => { let active = true; document.fonts?.ready.then(() => { if (active) setFontsReady(true); }); return () => { active = false; }; }, []);
  useEffect(()=>{const preview=canvasRef.current;if(!preview)return;const canvases=createDocumentCanvases({text,title,appearance,marks,drawings});const selected=canvases[Math.min(pageIndex,canvases.length-1)];if(!selected)return;preview.width=selected.width;preview.height=selected.height;preview.style.aspectRatio=selected.style.aspectRatio;const context=preview.getContext("2d");if(!context)return;context.drawImage(selected,0,0);onPageCount?.(canvases.length);},[appearance,canvasRef,drawings,fontsReady,marks,onPageCount,pageIndex,text,title]);
  return <canvas ref={canvasRef} aria-label="Generated handwritten note preview" className="note-canvas" />;
}

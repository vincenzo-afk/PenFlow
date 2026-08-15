/**
 * Field Notebook Atelier drawing model: local pointer samples are retained as editable
 * ink, while calibration derives visual writing traits without uploading biometrics.
 */
import { cloneAppearance, type DocumentAppearance } from "@/lib/appearance";

export type StrokeTool = "pen" | "highlighter" | "eraser";

export type InkPoint = { x: number; y: number; pressure: number; time: number };
export type InkStroke = { id: string; tool: StrokeTool; color: string; width: number; opacity: number; points: InkPoint[] };
export type DrawingLayer = { pageIndex: number; strokes: InkStroke[] };

export type CalibrationMetrics = {
  sampleCount: number;
  averagePressure: number;
  pressureVariation: number;
  averageSpeed: number;
  slant: number;
  letterSize: number;
  spacing: number;
  baselineDrift: number;
  tremor: number;
};

export type HandwritingProfile = {
  id: string;
  label: string;
  createdAt: string;
  metrics: CalibrationMetrics;
  sample: InkStroke[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: InkPoint, b: InkPoint) => Math.hypot(b.x - a.x, b.y - a.y);
const average = (values: number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

export function drawStroke(context: CanvasRenderingContext2D, stroke: InkStroke, pointLimit = stroke.points.length) {
  const points = stroke.points.slice(0, pointLimit); if (!points.length) return;
  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
  context.fillStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
  context.globalAlpha = stroke.tool === "highlighter" ? Math.min(.35, stroke.opacity) : stroke.opacity;
  context.lineCap = "round"; context.lineJoin = "round";
  if (points.length === 1) { context.beginPath(); context.arc(points[0].x, points[0].y, stroke.width * .35, 0, Math.PI * 2); context.fill(); context.restore(); return; }
  for (let index = 1; index < points.length; index += 1) {
    const prior = points[index - 1]; const point = points[index]; const width = stroke.width * (.55 + point.pressure * .82);
    context.lineWidth = stroke.tool === "highlighter" ? width * 2.6 : width;
    context.beginPath(); context.moveTo(prior.x, prior.y); context.lineTo(point.x, point.y); context.stroke();
  }
  context.restore();
}

export function drawLayers(context: CanvasRenderingContext2D, layers: DrawingLayer[], replayProgress = 1) {
  const strokes = layers.flatMap((layer) => layer.strokes); const total = strokes.reduce((count, stroke) => count + stroke.points.length, 0); let remaining = Math.floor(total * clamp(replayProgress, 0, 1));
  for (const stroke of strokes) { if (remaining <= 0) break; const limit = Math.min(stroke.points.length, remaining); drawStroke(context, stroke, limit); remaining -= limit; }
}

export function profileFromStrokes(label: string, strokes: InkStroke[]): HandwritingProfile {
  const points = strokes.flatMap((stroke) => stroke.points); const pressures = points.map((point) => point.pressure || .5); const pressureAverage = average(pressures) || .5;
  const pressureVariation = Math.sqrt(average(pressures.map((pressure) => (pressure - pressureAverage) ** 2)));
  const velocities: number[] = []; const directionalChanges: number[] = []; const heights: number[] = []; const gaps: number[] = []; const slants: number[] = [];
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    const xs = stroke.points.map((point) => point.x); const ys = stroke.points.map((point) => point.y); heights.push(Math.max(...ys) - Math.min(...ys));
    const dx = stroke.points[stroke.points.length - 1].x - stroke.points[0].x; const dy = stroke.points[stroke.points.length - 1].y - stroke.points[0].y;
    if (Math.abs(dy) > 4) slants.push(clamp((dx / Math.abs(dy)) * 7, -7, 7));
    for (let index = 1; index < stroke.points.length; index += 1) {
      const prior = stroke.points[index - 1]; const point = stroke.points[index]; velocities.push(distance(prior, point) / Math.max(1, point.time - prior.time));
      if (index > 1) { const before = stroke.points[index - 2]; const first = Math.atan2(prior.y - before.y, prior.x - before.x); const second = Math.atan2(point.y - prior.y, point.x - prior.x); directionalChanges.push(Math.abs(second - first)); }
    }
  }
  const ordered = strokes.filter((stroke) => stroke.points.length).slice().sort((a, b) => a.points[0].x - b.points[0].x);
  for (let index = 1; index < ordered.length; index += 1) { const previous = ordered[index - 1].points; const current = ordered[index].points; gaps.push(Math.max(0, current[0].x - previous[previous.length - 1].x)); }
  const baselineValues = strokes.filter((stroke) => stroke.points.length).map((stroke) => average(stroke.points.map((point) => point.y)));
  const baselineMean = average(baselineValues); const baselineDrift = Math.sqrt(average(baselineValues.map((value) => (value - baselineMean) ** 2)));
  const averageHeight = average(heights) || 48;
  const metrics: CalibrationMetrics = {
    sampleCount: strokes.length,
    averagePressure: pressureAverage,
    pressureVariation,
    averageSpeed: average(velocities),
    slant: clamp(average(slants), -6, 6),
    letterSize: clamp(16 + averageHeight * .17, 17, 31),
    spacing: clamp(average(gaps) / 45, 0, 1.5),
    baselineDrift: clamp(baselineDrift / 12, .12, 1.5),
    tremor: clamp(average(directionalChanges) * .22, .08, 1.25),
  };
  return { id: crypto.randomUUID(), label, createdAt: new Date().toISOString(), metrics, sample: strokes };
}

export function appearanceFromProfile(profile: HandwritingProfile, base: DocumentAppearance): DocumentAppearance {
  const { metrics } = profile; const next = cloneAppearance(base); const cursive = Math.abs(metrics.slant) > 2.8;
  next.pen.pressure = clamp(metrics.averagePressure, .08, .95); next.pen.flow = clamp(.42 + metrics.averageSpeed * 3.8, .35, .94); next.pen.nib = clamp(1.05 + metrics.averagePressure * .95, 1.0, 2.25); next.pen.slant = metrics.slant;
  next.handwriting.style = cursive ? "cursive" : metrics.averageSpeed > .38 ? "quick" : "scholar"; next.handwriting.size = Math.round(metrics.letterSize); next.handwriting.letterSpacing = clamp(metrics.spacing * .65, -.2, 1.1); next.handwriting.baselineDrift = metrics.baselineDrift; next.handwriting.tremor = metrics.tremor;
  next.humanize.enabled = true; next.humanize.amount = clamp(.34 + metrics.pressureVariation * 2.6, .34, .86); next.humanize.pauseRate = clamp(.1 + (1 / Math.max(.2, metrics.averageSpeed)) * .03, .12, .38); next.humanize.seed = Math.floor(Math.random() * 999999);
  return next;
}

export const emptyLayer = (pageIndex = 0): DrawingLayer => ({ pageIndex, strokes: [] });

/** Field Notebook Atelier ink surface: pointer/stylus input is local, pressure-aware, and replayable. */
import { useCallback, useEffect, useRef } from "react";
import { drawLayers, drawStroke, type InkPoint, type InkStroke, type StrokeTool } from "@/lib/drawing";

type StylusCanvasProps = {
  strokes: InkStroke[];
  onChange: (strokes: InkStroke[]) => void;
  tool: StrokeTool;
  color: string;
  width: number;
  opacity: number;
  disabled?: boolean;
  replayProgress?: number;
  className?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  label: string;
};

export function StylusCanvas({ strokes, onChange, tool, color, width, opacity, disabled = false, replayProgress = 1, className = "", canvasWidth = 760, canvasHeight = 1074, label }: StylusCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const activeRef = useRef<InkStroke | null>(null); const pointerRef = useRef<number | null>(null);
  const redraw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ratio = Math.min(window.devicePixelRatio || 1, 2); const context = canvas.getContext("2d"); if (!context) return;
    if (canvas.width !== canvasWidth * ratio || canvas.height !== canvasHeight * ratio) { canvas.width = canvasWidth * ratio; canvas.height = canvasHeight * ratio; }
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, canvasWidth, canvasHeight); drawLayers(context, [{ pageIndex: 0, strokes }], replayProgress);
    if (activeRef.current && replayProgress >= 1) drawStroke(context, activeRef.current);
  }, [canvasHeight, canvasWidth, replayProgress, strokes]);
  useEffect(() => { redraw(); }, [redraw]);

  const toPoint = (event: React.PointerEvent<HTMLCanvasElement>): InkPoint => {
    const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvasWidth / rect.width), y: (event.clientY - rect.top) * (canvasHeight / rect.height), pressure: event.pressure && event.pressure > 0 ? event.pressure : event.pointerType === "mouse" ? .48 : .62, time: performance.now() };
  };
  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || replayProgress < 1) return; event.preventDefault(); const point = toPoint(event); pointerRef.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId);
    activeRef.current = { id: crypto.randomUUID(), tool, color, width, opacity, points: [point] }; redraw();
  };
  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => { if (pointerRef.current !== event.pointerId || !activeRef.current) return; activeRef.current.points.push(toPoint(event)); redraw(); };
  const finish = (event: React.PointerEvent<HTMLCanvasElement>) => { if (pointerRef.current !== event.pointerId || !activeRef.current) return; const stroke = activeRef.current; activeRef.current = null; pointerRef.current = null; if (stroke.points.length) onChange([...strokes, stroke]); redraw(); };

  return <canvas ref={canvasRef} className={`stylus-canvas ${disabled ? "is-disabled" : ""} ${className}`} aria-label={label} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={finish} onPointerLeave={(event) => { if (event.buttons === 0) finish(event); }} />;
}

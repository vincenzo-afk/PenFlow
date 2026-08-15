import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { createReplayPageCanvas, PAGE_HEIGHT, PAGE_WIDTH } from "@/components/HandwritingCanvas";
import type { DocumentAppearance, TextMark } from "@/lib/appearance";
import type { InkStroke } from "@/lib/drawing";

export type ReplayDocument = { text: string; title: string; appearance: DocumentAppearance; marks: TextMark[]; drawings: Record<number, InkStroke[]> };
export type ReplayExportOptions = { resolution: "compact" | "standard"; speed: "calm" | "study" | "quick"; onProgress?: (value: number) => void };
export type VideoSupport = { supported: boolean; mimeType?: string; extension?: "mp4" | "webm"; label: string };

const settings = { compact: .42, standard: .58 } as const;
const speedMultiplier = { calm: .7, study: 1, quick: 1.55 } as const;
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function documentCreateCanvas(width: number, height: number) { const canvas = window.document.createElement("canvas"); canvas.width = width; canvas.height = height; return canvas; }

function makeFrame(document: ReplayDocument, pageIndex: number, progress: number, resolution: ReplayExportOptions["resolution"], reelPosition?: { index: number; total: number }) {
  const source = createReplayPageCanvas(document, pageIndex, progress); if (!source) throw new Error("PenFlow could not prepare the replay frame.");
  const scale = settings[resolution]; const frame = documentCreateCanvas(Math.round(PAGE_WIDTH * scale), Math.round(PAGE_HEIGHT * scale)); const context = frame.getContext("2d");
  if (!context) throw new Error("PenFlow could not prepare the export canvas.");
  context.fillStyle = "#fffdf7"; context.fillRect(0, 0, frame.width, frame.height); context.drawImage(source, 0, 0, frame.width, frame.height);
  if (reelPosition) {
    context.save(); context.fillStyle = "rgba(20, 32, 53, .82)"; context.fillRect(0, frame.height - 28, frame.width, 28);
    context.fillStyle = "#fffaf0"; context.font = "600 10px 'DM Mono', monospace"; context.textAlign = "center";
    context.fillText(`PENFLOW SESSION  •  PAGE ${reelPosition.index + 1} / ${reelPosition.total}`, frame.width / 2, frame.height - 10); context.restore();
  }
  return frame;
}

function frameImage(frame: HTMLCanvasElement) { const image = frame.getContext("2d")?.getImageData(0, 0, frame.width, frame.height); if (!image) throw new Error("PenFlow could not read the replay frame."); return image; }

function sessionTimeline(document: ReplayDocument, pageIndices: number[]) {
  const pages = Array.from(new Set(pageIndices)).sort((a, b) => a - b); if (pages.length < 2) throw new Error("Add direct ink to at least two sheets before exporting a session reel.");
  return pages.flatMap((pageIndex, pageOrder) => {
    const frameCount = document.drawings[pageIndex]?.length ? 16 : 7;
    const frames = Array.from({ length: frameCount }, (_, frameIndex) => ({ pageIndex, progress: frameIndex / (frameCount - 1), pageOrder }));
    return pageOrder < pages.length - 1 ? [...frames, { pageIndex, progress: 1, pageOrder }, { pageIndex: pages[pageOrder + 1], progress: 0, pageOrder: pageOrder + 1 }] : frames;
  });
}

export function supportedVideoExport(): VideoSupport {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined" || !("captureStream" in HTMLCanvasElement.prototype)) return { supported: false, label: "Video export is unavailable in this browser" };
  const candidates: Array<[string, "mp4" | "webm", string]> = [["video/mp4;codecs=avc1.42E01E", "mp4", "MP4"], ["video/webm;codecs=vp9", "webm", "WebM"], ["video/webm", "webm", "WebM"]];
  const available = candidates.find(([mime]) => MediaRecorder.isTypeSupported(mime)); return available ? { supported: true, mimeType: available[0], extension: available[1], label: available[2] } : { supported: false, label: "Video export is unavailable in this browser" };
}

export async function createReplayGif(document: ReplayDocument, pageIndex: number, options: ReplayExportOptions) {
  const frames = 24; const fps = 12; const encoder = GIFEncoder();
  for (let index = 0; index < frames; index += 1) {
    const frame = makeFrame(document, pageIndex, index / (frames - 1), options.resolution); const image = frameImage(frame);
    const palette = quantize(image.data, 96, { format: "rgb444" }); const indexed = applyPalette(image.data, palette, "rgb444");
    encoder.writeFrame(indexed, frame.width, frame.height, { palette, delay: Math.round(1000 / (fps * speedMultiplier[options.speed])), repeat: 0 }); options.onProgress?.((index + 1) / frames); await wait(0);
  }
  encoder.finish(); return new Blob([encoder.bytes()], { type: "image/gif" });
}

export async function createReplayVideo(document: ReplayDocument, pageIndex: number, options: ReplayExportOptions) {
  const support = supportedVideoExport(); if (!support.supported || !support.mimeType || !support.extension) throw new Error("This browser does not support recorded replay video.");
  const fps = 12; const frames = 28; const canvas = makeFrame(document, pageIndex, 0, options.resolution); const stream = canvas.captureStream(fps); const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }; const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: support.mimeType, videoBitsPerSecond: 2_500_000 }); recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise<void>((resolve, reject) => { recorder.onstop = () => resolve(); recorder.onerror = () => reject(new Error("PenFlow could not record this replay.")); }); recorder.start();
  for (let index = 0; index < frames; index += 1) { const next = makeFrame(document, pageIndex, index / (frames - 1), options.resolution); const context = canvas.getContext("2d"); if (!context) throw new Error("PenFlow could not update the replay video."); context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(next, 0, 0); track.requestFrame?.(); options.onProgress?.((index + 1) / frames); await wait(Math.round(1000 / (fps * speedMultiplier[options.speed]))); }
  recorder.stop(); await stopped; stream.getTracks().forEach((streamTrack) => streamTrack.stop()); return { blob: new Blob(chunks, { type: support.mimeType }), extension: support.extension, label: support.label };
}

export async function createSessionReelGif(document: ReplayDocument, pageIndices: number[], options: ReplayExportOptions) {
  const timeline = sessionTimeline(document, pageIndices); const totalPages = Array.from(new Set(pageIndices)).length; const encoder = GIFEncoder();
  for (let index = 0; index < timeline.length; index += 1) {
    const step = timeline[index]; const frame = makeFrame(document, step.pageIndex, step.progress, options.resolution, { index: step.pageOrder, total: totalPages }); const image = frameImage(frame);
    const palette = quantize(image.data, 96, { format: "rgb444" }); const indexed = applyPalette(image.data, palette, "rgb444");
    encoder.writeFrame(indexed, frame.width, frame.height, { palette, delay: Math.round(1000 / (12 * speedMultiplier[options.speed])), repeat: 0 }); options.onProgress?.((index + 1) / timeline.length); await wait(0);
  }
  encoder.finish(); return new Blob([encoder.bytes()], { type: "image/gif" });
}

export async function createSessionReelVideo(document: ReplayDocument, pageIndices: number[], options: ReplayExportOptions) {
  const support = supportedVideoExport(); if (!support.supported || !support.mimeType || !support.extension) throw new Error("This browser does not support recorded reel video.");
  const timeline = sessionTimeline(document, pageIndices); const totalPages = Array.from(new Set(pageIndices)).length; const fps = 12; const first = timeline[0]; const canvas = makeFrame(document, first.pageIndex, first.progress, options.resolution, { index: first.pageOrder, total: totalPages }); const stream = canvas.captureStream(fps); const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void }; const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: support.mimeType, videoBitsPerSecond: 2_500_000 }); recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise<void>((resolve, reject) => { recorder.onstop = () => resolve(); recorder.onerror = () => reject(new Error("PenFlow could not record this session reel.")); }); recorder.start();
  for (let index = 0; index < timeline.length; index += 1) {
    const step = timeline[index]; const next = makeFrame(document, step.pageIndex, step.progress, options.resolution, { index: step.pageOrder, total: totalPages }); const context = canvas.getContext("2d"); if (!context) throw new Error("PenFlow could not update the session reel.");
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(next, 0, 0); track.requestFrame?.(); options.onProgress?.((index + 1) / timeline.length); await wait(Math.round(1000 / (fps * speedMultiplier[options.speed])));
  }
  recorder.stop(); await stopped; stream.getTracks().forEach((streamTrack) => streamTrack.stop()); return { blob: new Blob(chunks, { type: support.mimeType }), extension: support.extension, label: support.label };
}

export function downloadReplay(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 2_000); }

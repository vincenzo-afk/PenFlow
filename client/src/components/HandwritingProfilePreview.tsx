/** Field Notebook Atelier calibration proof: a local, un-applied visual writing preview. */
import { useEffect, useMemo, useRef } from "react";
import { createDocumentCanvases } from "@/components/HandwritingCanvas";
import type { DocumentAppearance } from "@/lib/appearance";
import { appearanceFromProfile, profilePreviewTraits, type HandwritingProfile } from "@/lib/drawing";

type HandwritingProfilePreviewProps = {
  profile: HandwritingProfile | null;
  appearance: DocumentAppearance;
  label: string;
};

const previewText = "# A small sample, distinctly mine\nNotes become useful when I return to them with time, care, and a clear question.\n\n- Pressure carries through each line.\n- Rhythm changes from word to word.";

export function HandwritingProfilePreview({ profile, appearance, label }: HandwritingProfilePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const traits = useMemo(() => profile ? profilePreviewTraits(profile) : null, [profile]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const context = canvas.getContext("2d"); if (!context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = 310 * ratio; canvas.height = 438 * ratio; canvas.style.aspectRatio = "310 / 438"; context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#ece4d4"; context.fillRect(0, 0, 310, 438);
    if (!profile) { context.fillStyle = "#657080"; context.font = "500 12px 'DM Mono', monospace"; context.textAlign = "center"; context.fillText("WRITE A FEW SAMPLE STROKES", 155, 208); context.font = "400 13px Fraunces, serif"; context.fillText("to see your generated writing style", 155, 232); context.textAlign = "left"; return; }
    const previewAppearance = appearanceFromProfile(profile, appearance, true);
    const page = createDocumentCanvases({ text: previewText, title: label.trim() || "My writing profile", appearance: previewAppearance, marks: [], drawings: {} })[0];
    if (!page) return;
    context.drawImage(page, 0, 0, page.width, page.height, 0, 0, 310, 438);
  }, [appearance, label, profile]);

  return <div className="profile-preview"><div className="preview-heading"><span>LIVE STYLE PREVIEW</span><b>{profile ? "Not applied" : "Awaiting sample"}</b></div><canvas ref={canvasRef} aria-label="Generated handwriting style preview" />{traits && <div className="profile-traits">{Object.values(traits).map((trait) => <span key={trait}>{trait}</span>)}</div>}</div>;
}

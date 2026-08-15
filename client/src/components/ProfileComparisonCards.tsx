/** Field Notebook Atelier profile comparison: a paper proof, never an automatic style change. */
import { Check, Play } from "lucide-react";
import { HandwritingProfilePreview } from "@/components/HandwritingProfilePreview";
import type { DocumentAppearance } from "@/lib/appearance";
import type { HandwritingProfile } from "@/lib/drawing";

export type ComparisonProfile = { id: string; profile: HandwritingProfile; source: "live" | "saved" };

type ProfileComparisonCardsProps = {
  profiles: ComparisonProfile[];
  appearance: DocumentAppearance;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onApply: (profile: HandwritingProfile) => void;
};

export function ProfileComparisonCards({ profiles, appearance, selectedId, onSelect, onApply }: ProfileComparisonCardsProps) {
  if (profiles.length < 2) return <div className="comparison-empty"><strong>Build a comparison set</strong><span>Save a second local profile to view two writing styles side by side.</span></div>;
  return <div className="profile-comparison"><div className="comparison-heading"><span>COMPARE STYLE PROOFS</span><small>Select a sheet, then apply it when ready.</small></div><div className="comparison-grid">{profiles.slice(0, 4).map((item) => {
    const selected = item.id === selectedId;
    return <article key={item.id} className={selected ? "comparison-card selected" : "comparison-card"}>
      <button className="comparison-select" onClick={() => onSelect(item.id)} aria-pressed={selected}><span>{item.source === "live" ? "LIVE SAMPLE" : "SAVED PROFILE"}</span>{selected && <Check size={14} />}</button>
      <HandwritingProfilePreview profile={item.profile} appearance={appearance} label={item.profile.label} />
      <div className="comparison-card-footer"><strong>{item.profile.label}</strong><button className="outline-small" onClick={() => onApply(item.profile)}><Play size={12} /> Apply</button></div>
    </article>;
  })}</div></div>;
}

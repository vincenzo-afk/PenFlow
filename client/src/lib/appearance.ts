/** Field Notebook Atelier data model: physical writing choices are explicit, reusable document settings. */

export type PaperKind = "ruled" | "narrow" | "graph" | "dot" | "blank" | "cornell" | "planner" | "lab" | "music" | "flashcard";
export type HandwritingStyle = "scholar" | "quick" | "cursive" | "blueprint" | "rounded" | "caps";
export type PenKind = "gel" | "ballpoint" | "fountain" | "felt" | "pencil" | "highlighter";
export type CorrectionKind = "single" | "double" | "scribble" | "whiteout" | "caret" | "margin";
export type MarkKind = "underline" | "doubleUnderline" | "highlight" | "strike" | "scribble" | "circle" | "bracket" | "arrow";

export type PenSettings = {
  kind: PenKind;
  color: string;
  nib: number;
  opacity: number;
  pressure: number;
  flow: number;
  bleed: number;
  slant: number;
};

export type HandwritingSettings = {
  style: HandwritingStyle;
  size: number;
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number;
  baselineDrift: number;
  tremor: number;
  capitals: "natural" | "sentence" | "upper";
};

export type HumanizationSettings = {
  enabled: boolean;
  amount: number;
  typoRate: number;
  repeatRate: number;
  pauseRate: number;
  seed: number;
  cleanView: boolean;
};

export type PaperSettings = {
  kind: PaperKind;
  shade: "ivory" | "white" | "cream" | "blue" | "recycled";
  ruleColor: string;
  ruleWeight: number;
  margin: "left" | "right" | "none";
  texture: number;
  binding: "none" | "holes" | "spiral";
  fold: boolean;
};

export type CorrectionSettings = {
  kind: CorrectionKind;
  color: string;
  opacity: number;
};

export type TextMark = {
  id: string;
  target: string;
  kind: MarkKind;
  color: string;
  note?: string;
};

export type DocumentAppearance = {
  pen: PenSettings;
  handwriting: HandwritingSettings;
  humanize: HumanizationSettings;
  paper: PaperSettings;
  corrections: CorrectionSettings;
};

export const DEFAULT_APPEARANCE: DocumentAppearance = {
  pen: { kind: "gel", color: "#1b3d81", nib: 1.6, opacity: 0.94, pressure: 0.35, flow: 0.72, bleed: 0.08, slant: 0 },
  handwriting: { style: "scholar", size: 23, letterSpacing: 0, wordSpacing: 0, lineHeight: 1.36, baselineDrift: 0.46, tremor: 0.26, capitals: "natural" },
  humanize: { enabled: true, amount: 0.48, typoRate: 0.02, repeatRate: 0.015, pauseRate: 0.18, seed: 73421, cleanView: false },
  paper: { kind: "ruled", shade: "ivory", ruleColor: "#9abbdc", ruleWeight: 0.8, margin: "left", texture: 0.62, binding: "none", fold: true },
  corrections: { kind: "single", color: "#b94232", opacity: 0.78 },
};

export const APPEARANCE_PRESETS: Array<{ id: string; label: string; description: string; appearance: DocumentAppearance }> = [
  { id: "neat-gel", label: "Neat gel", description: "Clear, steady revision notes", appearance: DEFAULT_APPEARANCE },
  { id: "lecture", label: "Fast lecture", description: "Quick movement and lighter control", appearance: { ...DEFAULT_APPEARANCE, pen: { ...DEFAULT_APPEARANCE.pen, kind: "ballpoint", color: "#213d7a", nib: 1.3, flow: 0.58 }, handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: "quick", size: 22, baselineDrift: 1.1, tremor: 0.7 }, humanize: { ...DEFAULT_APPEARANCE.humanize, amount: 0.72, repeatRate: 0.035, pauseRate: 0.31 } } },
  { id: "fountain", label: "Fountain journal", description: "Expressive ink with natural pressure", appearance: { ...DEFAULT_APPEARANCE, pen: { ...DEFAULT_APPEARANCE.pen, kind: "fountain", color: "#32205e", nib: 2.1, pressure: 0.78, bleed: 0.16, slant: -3 }, handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: "cursive", size: 27, letterSpacing: .25 } } },
  { id: "pencil", label: "Mechanical pencil", description: "Fine grey working draft", appearance: { ...DEFAULT_APPEARANCE, pen: { ...DEFAULT_APPEARANCE.pen, kind: "pencil", color: "#38404a", nib: 1.05, opacity: 0.72, pressure: 0.5, flow: .48 }, handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: "rounded", size: 22, tremor: .5 }, paper: { ...DEFAULT_APPEARANCE.paper, kind: "graph", binding: "holes" } } },
  { id: "marker", label: "Marker revision", description: "High-contrast key points", appearance: { ...DEFAULT_APPEARANCE, pen: { ...DEFAULT_APPEARANCE.pen, kind: "felt", color: "#1e6046", nib: 2.45, opacity: 0.88, flow: .9 }, handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: "caps", size: 20, letterSpacing: .8 }, paper: { ...DEFAULT_APPEARANCE.paper, kind: "cornell", shade: "white" } } },
  { id: "draft", label: "Architect’s draft", description: "Blueprint lines and precise labels", appearance: { ...DEFAULT_APPEARANCE, pen: { ...DEFAULT_APPEARANCE.pen, kind: "technical" as PenKind, color: "#1b3d81", nib: 1.05, opacity: 0.88 }, handwriting: { ...DEFAULT_APPEARANCE.handwriting, style: "blueprint", size: 18, letterSpacing: .25, lineHeight: 1.45, baselineDrift: .1, tremor: .08, capitals: "upper" }, paper: { ...DEFAULT_APPEARANCE.paper, kind: "graph", shade: "blue", margin: "none", texture: .2, fold: false }, humanize: { ...DEFAULT_APPEARANCE.humanize, enabled: false, amount: .1 } } },
];

export const cloneAppearance = (appearance: DocumentAppearance) => JSON.parse(JSON.stringify(appearance)) as DocumentAppearance;

export const mergeAppearance = (appearance?: Partial<DocumentAppearance>): DocumentAppearance => ({
  ...cloneAppearance(DEFAULT_APPEARANCE),
  ...appearance,
  pen: { ...DEFAULT_APPEARANCE.pen, ...(appearance?.pen ?? {}) },
  handwriting: { ...DEFAULT_APPEARANCE.handwriting, ...(appearance?.handwriting ?? {}) },
  humanize: { ...DEFAULT_APPEARANCE.humanize, ...(appearance?.humanize ?? {}) },
  paper: { ...DEFAULT_APPEARANCE.paper, ...(appearance?.paper ?? {}) },
  corrections: { ...DEFAULT_APPEARANCE.corrections, ...(appearance?.corrections ?? {}) },
});

/**
 * Field Notebook Atelier workspace: an asymmetrical paper-first studio where every
 * pen, handwriting, paper, humanization, and correction choice is a visible tool.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, FolderOpen,
  Highlighter, History, ImageUp, Library, ListRestart, MoreHorizontal, PenLine, Plus, Redo2, Save, ScanText,
  Settings2, Sparkles, Strikethrough, Trash2, Undo2, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { createDocumentCanvases, HandwritingCanvas } from "@/components/HandwritingCanvas";
import {
  APPEARANCE_PRESETS, cloneAppearance, DEFAULT_APPEARANCE, mergeAppearance,
  type CorrectionKind, type DocumentAppearance, type HandwritingStyle, type MarkKind, type PaperKind, type PenKind, type TextMark,
} from "@/lib/appearance";

type SavedNote = { id: string; title: string; text: string; savedAt: string; subject: string; appearance?: DocumentAppearance; marks?: TextMark[]; };
type CustomPreset = { id: string; label: string; appearance: DocumentAppearance };

const starterText = `# How memory works
Memory is not a filing cabinet. It is an active reconstruction that changes every time we revisit it.

- Attention decides which details enter working memory.
- Retrieval strengthens a pathway more effectively than rereading.
- Spaced repetition creates durable long-term recall.

# Revision prompt
What is the difference between recognition and recall? Write one example of each?`;

const styleLabels: Record<HandwritingStyle, string> = { scholar: "Scholar", quick: "Quick notes", cursive: "Cursive", blueprint: "Blueprint", rounded: "Rounded", caps: "All caps" };
const paperLabels: Record<PaperKind, string> = { ruled: "Ruled A4", narrow: "Narrow rule", graph: "Graph", dot: "Dot grid", blank: "Blank", cornell: "Cornell", planner: "Planner", lab: "Lab book", music: "Music staff", flashcard: "Flashcard" };
const penLabels: Record<PenKind, string> = { gel: "Gel", ballpoint: "Ballpoint", fountain: "Fountain", felt: "Felt tip", pencil: "Pencil", highlighter: "Highlighter" };
const inkSwatches = ["#1b3d81", "#1d222b", "#b94232", "#1e6046", "#5d3873", "#14748b"];

function structureForStudy(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); if (!lines.length) return text;
  const result: string[] = [];
  lines.forEach((line, index) => {
    if (line.startsWith("#") || /^[-•*]\s/.test(line)) { result.push(line); return; }
    if (index === 0 || (line.length < 52 && !/[.!?]$/.test(line))) { result.push(`# ${line.replace(/:$/, "")}`); return; }
    const phrases = line.split(/(?<=[.!?])\s+/).filter(Boolean); result.push(...(phrases.length > 1 ? phrases.map((phrase) => `- ${phrase}`) : [`- ${line}`]));
  });
  return result.join("\n");
}

const safeName = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "penflow-note";
const markLabels: Record<MarkKind, string> = { underline: "Underline", doubleUnderline: "Double underline", highlight: "Highlight", strike: "Strike", scribble: "Scribble", circle: "Circle", bracket: "Bracket", arrow: "Arrow" };

export default function Home() {
  const [section, setSection] = useState<"studio" | "library">("studio");
  const [title, setTitle] = useState("Cognitive science — week 03");
  const [subject, setSubject] = useState("Psychology");
  const [text, setText] = useState(starterText);
  const [appearance, setAppearance] = useState<DocumentAppearance>(() => cloneAppearance(DEFAULT_APPEARANCE));
  const [marks, setMarks] = useState<TextMark[]>([]);
  const [pageCount, setPageCount] = useState(1);
  const [pageIndex, setPageIndex] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOcrBusy, setIsOcrBusy] = useState(false);
  const [library, setLibrary] = useState<SavedNote[]>([]);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [markTarget, setMarkTarget] = useState("");
  const [markKind, setMarkKind] = useState<MarkKind>("underline");
  const [openPanel, setOpenPanel] = useState<"pen" | "hand" | "human" | "marks" | "page" | "presets">("pen");
  const [history, setHistory] = useState<DocumentAppearance[]>([]);
  const [future, setFuture] = useState<DocumentAppearance[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const completion = Math.min(100, Math.round((words / 140) * 100));
  const allPresets = useMemo(() => [...APPEARANCE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, description: preset.description, appearance: preset.appearance })), ...customPresets.map((preset) => ({ ...preset, description: "Your saved appearance" }))], [customPresets]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("penflow-library"); if (stored) setLibrary(JSON.parse(stored));
      const savedPresets = localStorage.getItem("penflow-custom-presets"); if (savedPresets) setCustomPresets(JSON.parse(savedPresets));
    } catch { /* Browser storage is optional. */ }
  }, []);

  useEffect(() => { setPageIndex((index) => Math.min(index, Math.max(0, pageCount - 1))); }, [pageCount]);

  const updateAppearance = (updater: (current: DocumentAppearance) => DocumentAppearance) => {
    setAppearance((current) => { setHistory((items) => [...items.slice(-24), cloneAppearance(current)]); setFuture([]); return updater(current); });
  };
  const undoAppearance = () => { setHistory((items) => { const previous = items[items.length - 1]; if (!previous) return items; setAppearance((current) => { setFuture((next) => [cloneAppearance(current), ...next].slice(0, 25)); return cloneAppearance(previous); }); return items.slice(0, -1); }); };
  const redoAppearance = () => { setFuture((items) => { const next = items[0]; if (!next) return items; setAppearance((current) => { setHistory((past) => [...past, cloneAppearance(current)].slice(-25)); return cloneAppearance(next); }); return items.slice(1); }); };

  const saveToLibrary = () => {
    const note: SavedNote = { id: crypto.randomUUID(), title: title || "Untitled note", text, subject, savedAt: new Date().toISOString(), appearance: cloneAppearance(appearance), marks };
    const next = [note, ...library].slice(0, 12); setLibrary(next); localStorage.setItem("penflow-library", JSON.stringify(next)); toast.success("Saved this page and its pen settings to your local library.");
  };
  const loadNote = (note: SavedNote) => { setTitle(note.title); setText(note.text); setSubject(note.subject); setAppearance(mergeAppearance(note.appearance)); setMarks(note.marks ?? []); setSection("studio"); toast.message(`Opened “${note.title}”.`); };
  const deleteNote = (id: string) => { const next = library.filter((note) => note.id !== id); setLibrary(next); localStorage.setItem("penflow-library", JSON.stringify(next)); };
  const runStructure = () => { if (!text.trim()) { toast.error("Write or import some source material first."); return; } setText(structureForStudy(text)); toast.success("Source material shaped into revision-ready note blocks."); };

  const importFile = async (file: File) => {
    if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) { setText(await file.text()); toast.success(`Imported ${file.name}.`); return; }
    if (!file.type.startsWith("image/")) { toast.error("Use a .txt, .md, PNG, or JPG file for this client-side studio."); return; }
    const provider = (window as Window & { Tesseract?: { recognize: (item: File, language: string) => Promise<{ data: { text: string; confidence: number } }> } }).Tesseract;
    if (!provider) { toast.error("OCR is still loading. Please try the image import again in a moment."); return; }
    try { setIsOcrBusy(true); toast.message("Reading the page with OCR…"); const result = await provider.recognize(file, "eng"); const extracted = result.data.text.trim(); if (!extracted) throw new Error("No readable text found"); setText(extracted); toast.success(`OCR complete — ${Math.round(result.data.confidence)}% confidence.`); } catch (error) { toast.error(error instanceof Error ? `OCR could not read that image: ${error.message}` : "OCR could not read that image."); } finally { setIsOcrBusy(false); }
  };

  const renderedPages = () => createDocumentCanvases({ text, title, appearance, marks });
  const exportPng = () => { const pages = renderedPages(); const link = document.createElement("a"); link.href = pages[pageIndex].toDataURL("image/png"); link.download = `${safeName(title)}-page-${pageIndex + 1}.png`; link.click(); setIsExportOpen(false); toast.success("Current page exported as PNG."); };
  const exportPdf = () => {
    const JsPdf = (window as Window & { jspdf?: { jsPDF: new (options: object) => { addImage: (image: string, type: string, x: number, y: number, width: number, height: number) => void; addPage: () => void; save: (name: string) => void } } }).jspdf?.jsPDF;
    if (!JsPdf) { toast.error("PDF tools are still loading. Please try again in a moment."); return; }
    const pages = renderedPages(); const pdf = new JsPdf({ orientation: "p", unit: "px", format: [760, 1074] }); pages.forEach((page, index) => { if (index) pdf.addPage(); pdf.addImage(page.toDataURL("image/jpeg", .96), "JPEG", 0, 0, 760, 1074); }); pdf.save(`${safeName(title)}.pdf`); setIsExportOpen(false); toast.success(`${pages.length}-page PDF exported.`);
  };

  const applyPreset = (preset: DocumentAppearance, label: string) => { updateAppearance(() => cloneAppearance(preset)); toast.success(`Applied “${label}”.`); };
  const savePreset = () => { const label = window.prompt("Name this writing profile", "My writing profile")?.trim(); if (!label) return; const next = [...customPresets, { id: crypto.randomUUID(), label, appearance: cloneAppearance(appearance) }]; setCustomPresets(next); localStorage.setItem("penflow-custom-presets", JSON.stringify(next)); toast.success(`Saved “${label}” locally.`); };
  const deletePreset = (id: string) => { const next = customPresets.filter((preset) => preset.id !== id); setCustomPresets(next); localStorage.setItem("penflow-custom-presets", JSON.stringify(next)); };
  const reshuffle = () => updateAppearance((current) => ({ ...current, humanize: { ...current.humanize, seed: Math.floor(Math.random() * 999999) } }));

  const pullSelection = () => { const node = textRef.current; if (!node) return; const chosen = node.value.slice(node.selectionStart, node.selectionEnd).trim(); if (chosen) setMarkTarget(chosen); else toast.message("Select a phrase in your source text, then apply a handwritten mark."); };
  const addMark = () => { const target = markTarget.trim(); if (!target) { toast.error("Select or enter a phrase to mark first."); return; } setMarks((current) => [...current, { id: crypto.randomUUID(), target, kind: markKind, color: markKind === "highlight" ? "#f3c84b" : appearance.corrections.color }]); setMarkTarget(""); toast.success(`${markLabels[markKind]} added to the generated page.`); };
  const addCorrection = () => { const target = markTarget.trim(); if (!target) { toast.error("Select or enter a phrase to correct first."); return; } setMarks((current) => [...current, { id: crypto.randomUUID(), target, kind: appearance.corrections.kind === "scribble" ? "scribble" : "strike", color: appearance.corrections.color }]); setMarkTarget(""); toast.success("Human correction mark added."); };

  const Slider = ({ label, value, min, max, step = .01, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) => <div className="control-slider"><div className="label-row"><label>{label}</label><span>{value.toFixed(step < .1 ? 2 : 1)}{suffix}</span></div><input className="range-input" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
  const Panel = ({ id, title: panelTitle, caption, children }: { id: typeof openPanel; title: string; caption: string; children: React.ReactNode }) => <section className={openPanel === id ? "custom-panel open" : "custom-panel"}><button className="panel-toggle" onClick={() => setOpenPanel((current) => current === id ? "" as typeof openPanel : id)} aria-expanded={openPanel === id}><span><strong>{panelTitle}</strong><small>{caption}</small></span><ChevronDown size={15} /></button>{openPanel === id && <div className="panel-body">{children}</div>}</section>;

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-[#1b2432]">
      <aside className="studio-rail">
        <div className="rail-logo" aria-label="PenFlow"><img src="/manus-storage/penflow-logo-mark_5ac313b1.png" alt="PenFlow mark" /><span className="rail-wordmark"><b>Pen</b><i>Flow</i></span></div>
        <nav className="rail-navigation" aria-label="Main navigation"><button className={section === "studio" ? "rail-button active" : "rail-button"} onClick={() => setSection("studio")} title="Studio"><PenLine size={19} /><span>Studio</span></button><button className={section === "library" ? "rail-button active" : "rail-button"} onClick={() => setSection("library")} title="Library"><Library size={19} /><span>Library</span></button><button className="rail-button" onClick={() => { setSection("studio"); setOpenPanel("presets"); }} title="Writing profiles"><BookOpen size={19} /><span>Profiles</span></button></nav>
        <div className="rail-bottom"><button className="rail-button" onClick={() => toast.message("Your documents and custom profiles are saved in this browser.")} title="Workspace settings"><Settings2 size={19} /><span>Settings</span></button><span className="rail-version">v0.2</span></div>
      </aside>

      <main className="studio-shell">
        <header className="studio-topbar"><div className="topbar-context"><div className="brand-imprint" aria-label="PenFlow"><img src="/manus-storage/penflow-logo-mark_5ac313b1.png" alt="" /><span className="brand-pen">Pen</span><span className="brand-flow">Flow</span></div><span className="imprint-rule" /><span className="eyebrow">{section === "studio" ? "Handwriting studio" : "Local notebook library"}</span><span className="topbar-separator" /><span className="topbar-note">{section === "studio" ? "Every mark is local & editable" : `${library.length} saved ${library.length === 1 ? "note" : "notes"}`}</span></div><div className="topbar-actions">{section === "studio" && <><button className="quiet-action" disabled={!history.length} onClick={undoAppearance}><Undo2 size={15} /> Undo</button><button className="quiet-action" disabled={!future.length} onClick={redoAppearance}><Redo2 size={15} /> Redo</button><button className="quiet-action" onClick={saveToLibrary}><Save size={15} /> Save</button><div className="export-wrap"><button className="export-button" onClick={() => setIsExportOpen((open) => !open)}><Download size={15} /> Export <ChevronDown size={14} /></button>{isExportOpen && <div className="export-menu"><button onClick={exportPng}><ImageUp size={15} /><span><strong>PNG — this page</strong><small>Share the current sheet</small></span></button><button onClick={exportPdf}><FileText size={15} /><span><strong>PDF — all pages</strong><small>Print every generated sheet</small></span></button></div>}</div></>}</div></header>

        {section === "library" ? <section className="library-view"><div className="library-hero"><div><p className="eyebrow">Your browser, your notes</p><h1>Notebook library</h1><p>Every saved note carries its paper, pen, natural variation, and handwritten marks with it.</p></div><button className="primary-button" onClick={() => setSection("studio")}><Plus size={16} /> New note</button></div><div className="library-grid">{library.length ? library.map((note) => <article key={note.id} className="library-note"><div className="library-paper-corner" /><div className="library-note-top"><span>{note.subject}</span><button onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`}><Trash2 size={15} /></button></div><h2>{note.title}</h2><p>{note.text.replace(/[#*•-]/g, "").slice(0, 125)}{note.text.length > 125 ? "…" : ""}</p><footer><span>{new Date(note.savedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span><button onClick={() => loadNote(note)}>Open <ArrowRight size={14} /></button></footer></article>) : <div className="library-empty"><Archive size={28} /><h2>Nothing filed yet</h2><p>Save a generated note to keep its full writing profile here.</p><button className="primary-button" onClick={() => setSection("studio")}><PenLine size={16} /> Make a note</button></div>}</div></section> :
          <div className="studio-workbench human-workbench">
            <section className="source-panel"><div className="source-head"><div><p className="eyebrow">01 / Source</p><h1>Shape the source sheet.</h1></div><button className="icon-button" aria-label="More source options" onClick={() => toast.message("Your source remains private in this browser until you export or save it.")}><MoreHorizontal size={18} /></button></div><div className="source-visual"><img src="/manus-storage/penflow-hero-paper_ceb87fba.jpg" alt="PenFlow notebook and fountain pen" /><span>ANALOGUE INPUT, DIGITAL FLOW</span></div><div className="field-group title-group"><label htmlFor="note-title">Page title</label><input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this page" /></div><div className="subject-row"><label htmlFor="note-subject">Subject</label><select id="note-subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option>Psychology</option><option>Biology</option><option>History</option><option>Mathematics</option><option>Literature</option><option>General</option></select></div><div className="text-area-wrap"><textarea ref={textRef} aria-label="Source text" value={text} onSelect={pullSelection} onChange={(event) => setText(event.target.value)} placeholder="Paste a lecture, rough outline, or revision material…" /><div className="source-meta"><span>{words} words</span><span>{text.split(/\r?\n/).filter(Boolean).length} blocks</span></div></div><div className="source-actions"><button className="structure-button" onClick={runStructure}><Wand2 size={15} /> Shape into study notes</button><button className="import-button" onClick={() => fileRef.current?.click()} disabled={isOcrBusy}><ScanText size={15} /> {isOcrBusy ? "Reading page…" : "Import & OCR"}</button><input ref={fileRef} type="file" accept="image/*,.txt,.md" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} /></div><div className="source-help"><Sparkles size={14} /><span><strong>Source stays editable.</strong> Select any phrase here, then set ink, underline, highlight, strike, circle, annotate, or correct it on the revision sheet.</span></div></section>

            <section className="page-stage"><div className="stage-heading"><div><p className="eyebrow">02 / Preview</p><h2>{appearance.humanize.cleanView ? "Clean sheet, same content." : "One page, unmistakably yours."}</h2></div><span className="live-chip"><span /> {appearance.humanize.cleanView ? "Clean view" : "Ink is flowing"}</span></div><div className="page-display"><div className="paper-shadow" /><HandwritingCanvas canvasRef={canvasRef} text={text} title={title} appearance={appearance} marks={marks} pageIndex={pageIndex} onPageCount={setPageCount} /></div><div className="page-pager"><button onClick={() => setPageIndex((page) => Math.max(0, page - 1))} disabled={pageIndex === 0}><ChevronLeft size={16} /> Previous</button><span>Sheet {pageIndex + 1} of {pageCount}</span><button onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))} disabled={pageIndex === pageCount - 1}>Next <ChevronRight size={16} /></button></div><div className="stage-footer"><span><Check size={14} /> Page rendered locally</span><span>{marks.length} handwritten {marks.length === 1 ? "mark" : "marks"}</span></div></section>

            <aside className="inspector-panel advanced-inspector"><div className="inspector-head"><p className="eyebrow">03 / Humanize</p><h2>Every detail, yours.</h2></div>
              <Panel id="pen" title="Pen" caption={`${penLabels[appearance.pen.kind]} · ${appearance.pen.nib.toFixed(1)} mm`}><div className="tool-grid">{(Object.keys(penLabels) as PenKind[]).map((kind) => <button key={kind} className={appearance.pen.kind === kind ? "tool-choice selected" : "tool-choice"} onClick={() => updateAppearance((current) => ({ ...current, pen: { ...current.pen, kind } }))}>{penLabels[kind]}</button>)}</div><div className="swatch-row">{inkSwatches.map((color) => <button key={color} className={appearance.pen.color === color ? "color-swatch selected" : "color-swatch"} style={{ backgroundColor: color }} onClick={() => updateAppearance((current) => ({ ...current, pen: { ...current.pen, color } }))} aria-label={`Use ${color} ink`} />)}<label className="color-input"><span>+</span><input type="color" value={appearance.pen.color} onChange={(event) => updateAppearance((current) => ({ ...current, pen: { ...current.pen, color: event.target.value } }))} aria-label="Custom ink color" /></label></div><Slider label="Nib width" value={appearance.pen.nib} min={.7} max={3.4} step={.1} suffix=" mm" onChange={(value) => updateAppearance((current) => ({ ...current, pen: { ...current.pen, nib: value } }))} /><Slider label="Opacity" value={appearance.pen.opacity} min={.25} max={1} onChange={(value) => updateAppearance((current) => ({ ...current, pen: { ...current.pen, opacity: value } }))} /><Slider label="Pressure" value={appearance.pen.pressure} min={0} max={1} onChange={(value) => updateAppearance((current) => ({ ...current, pen: { ...current.pen, pressure: value } }))} /><Slider label="Ink flow" value={appearance.pen.flow} min={0} max={1} onChange={(value) => updateAppearance((current) => ({ ...current, pen: { ...current.pen, flow: value } }))} /></Panel>
              <Panel id="hand" title="Handwriting" caption={`${styleLabels[appearance.handwriting.style]} · ${appearance.handwriting.size}px`}><div className="tool-grid three">{(Object.keys(styleLabels) as HandwritingStyle[]).map((style) => <button key={style} className={appearance.handwriting.style === style ? "tool-choice selected" : "tool-choice"} onClick={() => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, style } }))}>{styleLabels[style]}</button>)}</div><Slider label="Letter size" value={appearance.handwriting.size} min={14} max={33} step={1} suffix=" px" onChange={(value) => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, size: value } }))} /><Slider label="Line height" value={appearance.handwriting.lineHeight} min={1.05} max={1.9} onChange={(value) => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, lineHeight: value } }))} /><Slider label="Letter spacing" value={appearance.handwriting.letterSpacing} min={-1.2} max={2.2} onChange={(value) => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, letterSpacing: value } }))} /><div className="button-row">{(["natural", "sentence", "upper"] as const).map((mode) => <button key={mode} className={appearance.handwriting.capitals === mode ? "tiny-choice selected" : "tiny-choice"} onClick={() => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, capitals: mode } }))}>{mode === "upper" ? "ALL CAPS" : mode}</button>)}</div></Panel>
              <Panel id="human" title="Humanity" caption={appearance.humanize.cleanView ? "Clean preview" : `${Math.round(appearance.humanize.amount * 100)}% natural variation`}><div className="switch-row"><span><strong>Human variation</strong><small>Baseline, pressure & character shifts</small></span><button className={appearance.humanize.enabled ? "switch checked" : "switch"} onClick={() => updateAppearance((current) => ({ ...current, humanize: { ...current.humanize, enabled: !current.humanize.enabled } }))} aria-pressed={appearance.humanize.enabled}><span /></button></div><Slider label="Natural variation" value={appearance.humanize.amount} min={0} max={1} onChange={(value) => updateAppearance((current) => ({ ...current, humanize: { ...current.humanize, amount: value } }))} /><Slider label="Hand tremor" value={appearance.handwriting.tremor} min={0} max={1.4} onChange={(value) => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, tremor: value } }))} /><Slider label="Baseline drift" value={appearance.handwriting.baselineDrift} min={0} max={1.5} onChange={(value) => updateAppearance((current) => ({ ...current, handwriting: { ...current.handwriting, baselineDrift: value } }))} /><Slider label="Correction chance" value={appearance.humanize.typoRate} min={0} max={.12} step={.01} onChange={(value) => updateAppearance((current) => ({ ...current, humanize: { ...current.humanize, typoRate: value } }))} /><div className="human-actions"><button className="quiet-tool" onClick={reshuffle}><History size={13} /> Reshuffle variation</button><button className={appearance.humanize.cleanView ? "quiet-tool selected" : "quiet-tool"} onClick={() => updateAppearance((current) => ({ ...current, humanize: { ...current.humanize, cleanView: !current.humanize.cleanView } }))}><ListRestart size={13} /> {appearance.humanize.cleanView ? "Show humanity" : "Clean view"}</button></div></Panel>
              <Panel id="marks" title="Marks & corrections" caption={`${marks.length} applied`}><div className="mark-input"><input value={markTarget} onChange={(event) => setMarkTarget(event.target.value)} placeholder="Selected phrase appears here" /><button onClick={pullSelection} title="Capture selected text"><Highlighter size={15} /></button></div><div className="tool-grid three">{(Object.keys(markLabels) as MarkKind[]).map((kind) => <button key={kind} className={markKind === kind ? "tool-choice selected" : "tool-choice"} onClick={() => setMarkKind(kind)}>{markLabels[kind]}</button>)}</div><div className="button-row"><button className="primary-small" onClick={addMark}>Apply {markLabels[markKind]}</button><button className="outline-small" onClick={addCorrection}><Strikethrough size={13} /> Correct</button></div><div className="button-row">{(["single", "double", "scribble", "whiteout", "caret", "margin"] as CorrectionKind[]).map((kind) => <button key={kind} className={appearance.corrections.kind === kind ? "tiny-choice selected" : "tiny-choice"} onClick={() => updateAppearance((current) => ({ ...current, corrections: { ...current.corrections, kind } }))}>{kind}</button>)}</div>{marks.length > 0 && <div className="mark-list">{marks.map((mark) => <button key={mark.id} onClick={() => setMarks((current) => current.filter((item) => item.id !== mark.id))}><span>{markLabels[mark.kind]} · “{mark.target.slice(0, 21)}{mark.target.length > 21 ? "…" : ""}”</span><Trash2 size={12} /></button>)}</div>}</Panel>
              <Panel id="page" title="Paper & page" caption={paperLabels[appearance.paper.kind]}><div className="tool-grid three">{(Object.keys(paperLabels) as PaperKind[]).map((kind) => <button key={kind} className={appearance.paper.kind === kind ? "tool-choice selected" : "tool-choice"} onClick={() => updateAppearance((current) => ({ ...current, paper: { ...current.paper, kind } }))}>{paperLabels[kind]}</button>)}</div><div className="button-row">{(["ivory", "white", "cream", "blue", "recycled"] as const).map((shade) => <button key={shade} className={appearance.paper.shade === shade ? "tiny-choice selected" : "tiny-choice"} onClick={() => updateAppearance((current) => ({ ...current, paper: { ...current.paper, shade } }))}>{shade}</button>)}</div><Slider label="Paper texture" value={appearance.paper.texture} min={0} max={1} onChange={(value) => updateAppearance((current) => ({ ...current, paper: { ...current.paper, texture: value } }))} /><div className="button-row">{(["none", "holes", "spiral"] as const).map((binding) => <button key={binding} className={appearance.paper.binding === binding ? "tiny-choice selected" : "tiny-choice"} onClick={() => updateAppearance((current) => ({ ...current, paper: { ...current.paper, binding } }))}>{binding}</button>)}</div></Panel>
              <Panel id="presets" title="Profiles" caption="Reusable writing identities"><div className="preset-list">{allPresets.map((preset) => <div key={preset.id} className="preset-item"><button onClick={() => applyPreset(preset.appearance, preset.label)}><strong>{preset.label}</strong><small>{preset.description}</small></button>{customPresets.some((item) => item.id === preset.id) && <button className="preset-delete" onClick={() => deletePreset(preset.id)} aria-label={`Delete ${preset.label}`}><Trash2 size={13} /></button>}</div>)}</div><div className="button-row"><button className="primary-small" onClick={savePreset}><Save size={13} /> Save this profile</button><button className="outline-small" onClick={() => updateAppearance(() => cloneAppearance(DEFAULT_APPEARANCE))}><ListRestart size={13} /> Reset</button></div></Panel>
              <div className="readiness-card"><div className="readiness-top"><span>Revision readiness</span><strong>{completion}%</strong></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div><p>{words < 80 ? "Add a few more points to give this page useful revision depth." : "This page has enough material to return to during revision."}</p></div>
              <div className="ocr-callout"><img src="/manus-storage/penflow-ocr-card_1d1a085d.jpg" alt="Study paper ready for OCR import" /><div><span>Bring in a scan</span><p>Use OCR to pull a photographed page into this fully editable studio.</p><button onClick={() => fileRef.current?.click()}>Import a page <ArrowRight size={13} /></button></div></div>
            </aside>
          </div>}
      </main>
    </div>
  );
}

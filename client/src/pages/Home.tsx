/**
 * Field Notebook Atelier page: PenFlow presents writing as a tactile left-to-right studio flow,
 * pairing editorial typography with a warm paper stage and practical local-first tooling.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileText,
  FolderOpen,
  ImageUp,
  Library,
  MoreHorizontal,
  PenLine,
  Plus,
  Save,
  ScanText,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { HandwritingCanvas, type HandwritingStyle, type InkColor, type PaperKind } from "@/components/HandwritingCanvas";

type SavedNote = {
  id: string;
  title: string;
  text: string;
  savedAt: string;
  subject: string;
};

const starterText = `# How memory works
Memory is not a filing cabinet. It is an active reconstruction that changes every time we revisit it.

- Attention decides which details enter working memory.
- Retrieval strengthens a pathway more effectively than rereading.
- Spaced repetition creates durable long-term recall.

# Revision prompt
What is the difference between recognition and recall? Write one example of each.`;

const styleLabels: Record<HandwritingStyle, string> = {
  scholar: "Scholar",
  quick: "Quick notes",
  cursive: "Cursive",
  blueprint: "Blueprint",
};

const paperLabels: Record<PaperKind, string> = {
  ruled: "Ruled A4",
  graph: "Graph",
  dot: "Dot grid",
  blank: "Blank",
};

const inkLabels: Record<InkColor, string> = {
  indigo: "Indigo",
  black: "Black",
  vermilion: "Vermilion",
  forest: "Forest",
};

function structureForStudy(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return text;
  const result: string[] = [];
  lines.forEach((line, index) => {
    if (line.startsWith("#") || /^[-•*]\s/.test(line)) {
      result.push(line);
      return;
    }
    if (index === 0 || line.length < 52 && !/[.!?]$/.test(line)) {
      result.push(`# ${line.replace(/:$/, "")}`);
      return;
    }
    const phrases = line.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (phrases.length > 1) {
      result.push(...phrases.map((phrase) => `- ${phrase}`));
    } else {
      result.push(`- ${line}`);
    }
  });
  return result.join("\n");
}

export default function Home() {
  const [section, setSection] = useState<"studio" | "library">("studio");
  const [title, setTitle] = useState("Cognitive science — week 03");
  const [subject, setSubject] = useState("Psychology");
  const [text, setText] = useState(starterText);
  const [paper, setPaper] = useState<PaperKind>("ruled");
  const [handwriting, setHandwriting] = useState<HandwritingStyle>("scholar");
  const [ink, setInk] = useState<InkColor>("indigo");
  const [thickness, setThickness] = useState(1.6);
  const [realism, setRealism] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOcrBusy, setIsOcrBusy] = useState(false);
  const [library, setLibrary] = useState<SavedNote[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const completion = Math.min(100, Math.round((words / 140) * 100));

  useEffect(() => {
    try {
      const stored = localStorage.getItem("penflow-library");
      if (stored) setLibrary(JSON.parse(stored));
    } catch {
      // A local-storage failure should never block writing or exporting.
    }
  }, []);

  const saveToLibrary = () => {
    const note: SavedNote = {
      id: crypto.randomUUID(),
      title: title || "Untitled note",
      text,
      subject,
      savedAt: new Date().toISOString(),
    };
    const next = [note, ...library].slice(0, 12);
    setLibrary(next);
    localStorage.setItem("penflow-library", JSON.stringify(next));
    toast.success("Saved to your local notebook library.");
  };

  const loadNote = (note: SavedNote) => {
    setTitle(note.title);
    setText(note.text);
    setSubject(note.subject);
    setSection("studio");
    toast.message(`Opened “${note.title}”.`);
  };

  const deleteNote = (id: string) => {
    const next = library.filter((note) => note.id !== id);
    setLibrary(next);
    localStorage.setItem("penflow-library", JSON.stringify(next));
  };

  const runStructure = () => {
    if (!text.trim()) {
      toast.error("Write or import some source material first.");
      return;
    }
    setText(structureForStudy(text));
    toast.success("Source material shaped into revision-ready note blocks.");
  };

  const importFile = async (file: File) => {
    if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
      setText(await file.text());
      toast.success(`Imported ${file.name}.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Use a .txt, .md, PNG, or JPG file for this client-side demo.");
      return;
    }
    const provider = (window as any).Tesseract;
    if (!provider) {
      toast.error("OCR is still loading. Please try the image import again in a moment.");
      return;
    }
    try {
      setIsOcrBusy(true);
      toast.message("Reading the page with OCR…");
      const result = await provider.recognize(file, "eng");
      const extracted = result?.data?.text?.trim();
      if (!extracted) throw new Error("No readable text found");
      setText(extracted);
      toast.success(`OCR complete — ${Math.round(result.data.confidence)}% confidence.`);
    } catch (error) {
      toast.error(error instanceof Error ? `OCR could not read that image: ${error.message}` : "OCR could not read that image.");
    } finally {
      setIsOcrBusy(false);
    }
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "penflow-note"}.png`;
    link.click();
    setIsExportOpen(false);
    toast.success("PNG page exported.");
  };

  const exportPdf = () => {
    const canvas = canvasRef.current;
    const JsPdf = (window as any).jspdf?.jsPDF;
    if (!canvas || !JsPdf) {
      toast.error("PDF tools are still loading. Please try again in a moment.");
      return;
    }
    const pdf = new JsPdf({ orientation: "p", unit: "px", format: [760, 1074] });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, 760, 1074);
    pdf.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "penflow-note"}.pdf`);
    setIsExportOpen(false);
    toast.success("Print-ready PDF exported.");
  };

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-[#1b2432]">
      <aside className="studio-rail">
        <div className="rail-logo" aria-label="PenFlow">
          <img src="/manus-storage/penflow-logo-mark_5ac313b1.png" alt="PenFlow mark" />
        </div>
        <nav className="rail-navigation" aria-label="Main navigation">
          <button className={section === "studio" ? "rail-button active" : "rail-button"} onClick={() => setSection("studio")} title="Studio">
            <PenLine size={19} /><span>Studio</span>
          </button>
          <button className={section === "library" ? "rail-button active" : "rail-button"} onClick={() => setSection("library")} title="Library">
            <Library size={19} /><span>Library</span>
          </button>
          <button className="rail-button" onClick={() => toast.message("Templates are coming next — the current paper controls already shape each page.")} title="Templates">
            <BookOpen size={19} /><span>Templates</span>
          </button>
        </nav>
        <div className="rail-bottom">
          <button className="rail-button" onClick={() => toast.message("Your workspace is saved in this browser.")} title="Workspace settings">
            <Settings2 size={19} /><span>Settings</span>
          </button>
          <span className="rail-version">v0.1</span>
        </div>
      </aside>

      <main className="studio-shell">
        <header className="studio-topbar">
          <div className="topbar-context">
            <div className="brand-imprint" aria-label="PenFlow">
              <img src="/manus-storage/penflow-logo-mark_5ac313b1.png" alt="" />
              <span className="brand-pen">Pen</span><span className="brand-flow">Flow</span>
            </div>
            <span className="imprint-rule" />
            <span className="eyebrow">{section === "studio" ? "Notebook studio" : "Local notebook library"}</span>
            <span className="topbar-separator" />
            <span className="topbar-note">{section === "studio" ? "Autosaved in this session" : `${library.length} saved ${library.length === 1 ? "note" : "notes"}`}</span>
          </div>
          <div className="topbar-actions">
            <button className="quiet-action" onClick={saveToLibrary}><Save size={15} /> Save</button>
            <div className="export-wrap">
              <button className="export-button" onClick={() => setIsExportOpen((open) => !open)}><Download size={15} /> Export <ChevronDown size={14} /></button>
              {isExportOpen && (
                <div className="export-menu">
                  <button onClick={exportPng}><ImageUp size={15} /><span><strong>PNG image</strong><small>For sharing or slides</small></span></button>
                  <button onClick={exportPdf}><FileText size={15} /><span><strong>PDF document</strong><small>For printing on A4</small></span></button>
                </div>
              )}
            </div>
          </div>
        </header>

        {section === "library" ? (
          <section className="library-view">
            <div className="library-hero">
              <div><p className="eyebrow">Your browser, your notes</p><h1>Notebook library</h1><p>Keep drafts you want to return to. PenFlow stores these pages locally in this browser.</p></div>
              <button className="primary-button" onClick={() => setSection("studio")}><Plus size={16} /> New note</button>
            </div>
            <div className="library-grid">
              {library.length ? library.map((note) => (
                <article key={note.id} className="library-note">
                  <div className="library-paper-corner" />
                  <div className="library-note-top"><span>{note.subject}</span><button onClick={() => deleteNote(note.id)} aria-label={`Delete ${note.title}`}><Trash2 size={15} /></button></div>
                  <h2>{note.title}</h2>
                  <p>{note.text.replace(/[#*•-]/g, "").slice(0, 125)}{note.text.length > 125 ? "…" : ""}</p>
                  <footer><span>{new Date(note.savedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span><button onClick={() => loadNote(note)}>Open <ArrowRight size={14} /></button></footer>
                </article>
              )) : (
                <div className="library-empty"><Archive size={28} /><h2>Nothing filed yet</h2><p>Save a generated note to keep a reusable local copy here.</p><button className="primary-button" onClick={() => setSection("studio")}><PenLine size={16} /> Make a note</button></div>
              )}
            </div>
          </section>
        ) : (
          <div className="studio-workbench">
            <section className="source-panel">
              <div className="source-head"><div><p className="eyebrow">01 / Source</p><h1>Make the note yours.</h1></div><button className="icon-button" aria-label="More source options" onClick={() => toast.message("Your current source stays local until you export or save it.")}><MoreHorizontal size={18} /></button></div>
              <div className="source-visual"><img src="/manus-storage/penflow-hero-paper_ceb87fba.jpg" alt="PenFlow notebook and fountain pen" /><span>ANALOGUE INPUT, DIGITAL FLOW</span></div>
              <div className="field-group title-group"><label htmlFor="note-title">Page title</label><input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this page" /></div>
              <div className="subject-row"><label htmlFor="note-subject">Subject</label><select id="note-subject" value={subject} onChange={(event) => setSubject(event.target.value)}><option>Psychology</option><option>Biology</option><option>History</option><option>Mathematics</option><option>Literature</option><option>General</option></select></div>
              <div className="text-area-wrap"><textarea aria-label="Source text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste a lecture, rough outline, or revision material…" /><div className="source-meta"><span>{words} words</span><span>{text.split(/\r?\n/).filter(Boolean).length} blocks</span></div></div>
              <div className="source-actions"><button className="structure-button" onClick={runStructure}><Wand2 size={15} /> Shape into study notes</button><button className="import-button" onClick={() => fileRef.current?.click()} disabled={isOcrBusy}><ScanText size={15} /> {isOcrBusy ? "Reading page…" : "Import & OCR"}</button><input ref={fileRef} type="file" accept="image/*,.txt,.md" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} /></div>
              <div className="source-help"><Sparkles size={14} /><span><strong>Study shaping</strong> turns sentences into headings and revision bullets. OCR reads JPG and PNG scans in your browser.</span></div>
            </section>

            <section className="page-stage">
              <div className="stage-heading"><div><p className="eyebrow">02 / Preview</p><h2>One page, ready to revise.</h2></div><span className="live-chip"><span /> Ink is flowing</span></div>
              <div className="page-display"><div className="paper-shadow" /><HandwritingCanvas canvasRef={canvasRef} text={text} title={title} paper={paper} handwriting={handwriting} ink={ink} thickness={thickness} realism={realism} /></div>
              <div className="stage-footer"><span><Check size={14} /> Page rendered locally</span><span>1 of {Math.max(1, Math.ceil(words / 300))} pages</span></div>
            </section>

            <aside className="inspector-panel">
              <div className="inspector-head"><p className="eyebrow">03 / Finish</p><h2>Ink & paper</h2></div>
              <div className="setting-block"><label>Paper stock</label><div className="choice-grid paper-grid">{(Object.keys(paperLabels) as PaperKind[]).map((value) => <button key={value} onClick={() => setPaper(value)} className={paper === value ? "choice-card selected" : "choice-card"}><span className={`paper-swatch ${value}`} /><span>{paperLabels[value]}</span></button>)}</div></div>
              <div className="setting-block"><label>Handwriting</label><div className="segmented">{(Object.keys(styleLabels) as HandwritingStyle[]).map((value) => <button key={value} onClick={() => setHandwriting(value)} className={handwriting === value ? "selected" : ""}>{styleLabels[value]}</button>)}</div></div>
              <div className="setting-block"><label>Ink color</label><div className="ink-row">{(Object.keys(inkLabels) as InkColor[]).map((value) => <button key={value} title={inkLabels[value]} onClick={() => setInk(value)} className={ink === value ? `ink-dot ${value} selected` : `ink-dot ${value}`}><span /></button>)}</div></div>
              <div className="setting-block"><div className="label-row"><label htmlFor="ink-thickness">Ink density</label><span>{thickness.toFixed(1)}</span></div><input id="ink-thickness" className="range-input" type="range" min="1" max="2.6" step="0.1" value={thickness} onChange={(event) => setThickness(Number(event.target.value))} /></div>
              <div className="reality-toggle"><div><strong>Paper realism</strong><span>Soft grain, page edge & fold</span></div><button aria-pressed={realism} onClick={() => setRealism((value) => !value)} className={realism ? "switch checked" : "switch"}><span /></button></div>
              <div className="readiness-card"><div className="readiness-top"><span>Revision readiness</span><strong>{completion}%</strong></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div><p>{words < 80 ? "Add a few more points to make this page useful for revision." : "This page has enough material to return to during revision."}</p></div>
              <div className="ocr-callout"><img src="/manus-storage/penflow-ocr-card_1d1a085d.jpg" alt="Study paper ready for OCR import" /><div><span>Bring in a scan</span><p>Use OCR to pull a photographed page into this editor.</p><button onClick={() => fileRef.current?.click()}>Import a page <ArrowRight size={13} /></button></div></div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

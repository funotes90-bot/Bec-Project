import { useState, useRef } from "react";
import { PenLine, Loader2, RefreshCw, Sparkles, Shuffle, Camera } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import AnalysisView from "@/components/AnalysisView";
import { WRITING_PROMPTS, WRITING_CATEGORIES, promptsForCategory, randomPrompt } from "@/lib/prompts";
import { toast } from "sonner";

export default function Writing() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("all");
  const [prompt, setPrompt] = useState(() => randomPrompt(WRITING_PROMPTS));
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const changeCategory = (catId) => {
    setCategory(catId);
    setPrompt(randomPrompt(promptsForCategory(WRITING_CATEGORIES, catId)));
  };

  const analyzePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAnalyzing(true);
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await api.post("/writing/analyze-image", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
      toast.success("Handwriting analysed!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const analyze = async () => {
    if (text.trim().length < 10) {
      toast.error("Please write at least a few sentences.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await api.post("/writing/analyze", { text, prompt });
      setResult(res.data);
      toast.success("Analysis ready!");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Writing Practice</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Write & analyse your text</h1>
      </div>

      {!result && (
        <div className="flex flex-wrap gap-2" data-testid="writing-categories">
          {[{ id: "all", label: "All Topics" }, ...WRITING_CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => changeCategory(c.id)} data-testid={`writing-cat-${c.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-[background-color,color] duration-200 ${category === c.id ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {!result && (
      <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <PenLine className="text-white" size={18} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Writing prompt</p>
          <p className="text-zinc-800 font-medium" data-testid="writing-prompt">{prompt}</p>
        </div>
        <button onClick={() => setPrompt((p) => randomPrompt(promptsForCategory(WRITING_CATEGORIES, category), p))} data-testid="shuffle-writing-btn"
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-[background-color] duration-200 flex-shrink-0">
          <Shuffle size={14} /> New
        </button>
      </div>
      )}

      {!result && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          {analyzing ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="animate-spin text-zinc-900" size={40} />
              <p className="text-zinc-600">Analysing your writing…</p>
            </div>
          ) : (
          <>
            <textarea
              data-testid="writing-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Start writing here…"
              className="w-full resize-none rounded-xl border border-zinc-200 p-4 text-sm leading-relaxed focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <span className="font-mono text-xs text-zinc-400">{words} words</span>
              <div className="flex flex-wrap gap-3">
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={analyzePhoto} className="hidden" data-testid="handwriting-file-input" />
                <button onClick={() => fileRef.current?.click()} data-testid="photo-handwriting-btn"
                  className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-full px-5 py-2.5 font-medium transition-[background-color] duration-200">
                  <Camera size={18} /> Photo of handwriting
                </button>
                <button onClick={analyze} data-testid="analyze-writing-btn"
                  className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 font-medium transition-[background-color] duration-200">
                  <Sparkles size={18} /> Analyse writing
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mt-3">Tip: type your text, or snap a photo of your handwritten answer to get instant feedback.</p>
          </>
          )}
        </div>
      )}

      {result && (
        <div>
          <button onClick={() => { setResult(null); setText(""); setPrompt(randomPrompt(promptsForCategory(WRITING_CATEGORIES, category))); }} data-testid="new-writing-btn"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mb-6 transition-[color] duration-200">
            <RefreshCw size={16} /> Write another
          </button>
          <AnalysisView analysis={result.analysis} mode="writing" content={result.content} />
        </div>
      )}
    </div>
  );
}

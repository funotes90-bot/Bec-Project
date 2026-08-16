import { useState } from "react";
import { PenLine, Loader2, RefreshCw, Sparkles } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import AnalysisView from "@/components/AnalysisView";
import { toast } from "sonner";

const PROMPTS = [
  "Write a professional email requesting a meeting with a potential client.",
  "Draft a short report summarising your team's performance this quarter.",
  "Write a reply declining a business proposal politely.",
  "Compose a message introducing a new product to existing customers.",
];

export default function Writing() {
  const [text, setText] = useState("");
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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

      <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <PenLine className="text-white" size={18} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Writing prompt</p>
          <p className="text-zinc-800 font-medium">{prompt}</p>
        </div>
      </div>

      {!result && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <textarea
            data-testid="writing-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="Start writing here…"
            className="w-full resize-none rounded-xl border border-zinc-200 p-4 text-sm leading-relaxed focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="font-mono text-xs text-zinc-400">{words} words</span>
            <button onClick={analyze} data-testid="analyze-writing-btn" disabled={analyzing}
              className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 font-medium transition-[background-color] duration-200 disabled:opacity-60">
              {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {analyzing ? "Analysing…" : "Analyse writing"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div>
          <button onClick={() => { setResult(null); setText(""); }} data-testid="new-writing-btn"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mb-6 transition-[color] duration-200">
            <RefreshCw size={16} /> Write another
          </button>
          <AnalysisView analysis={result.analysis} mode="writing" content={result.content} />
        </div>
      )}
    </div>
  );
}

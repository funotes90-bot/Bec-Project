import { Activity, Sparkles, Volume2, Target, CheckCircle2, ArrowRight, Award } from "lucide-react";

const SCORE_META = {
  grammar: { label: "Grammar", color: "text-rose-600", bar: "bg-rose-500" },
  vocabulary: { label: "Vocabulary", color: "text-violet-700", bar: "bg-violet-600" },
  pronunciation: { label: "Pronunciation", color: "text-emerald-600", bar: "bg-emerald-500" },
  fluency: { label: "Fluency", color: "text-blue-600", bar: "bg-blue-500" },
  coherence: { label: "Coherence", color: "text-blue-600", bar: "bg-blue-500" },
  task_achievement: { label: "Task Achievement", color: "text-amber-600", bar: "bg-amber-500" },
};

function ScoreBar({ k, value }) {
  const m = SCORE_META[k] || { label: k, color: "text-zinc-700", bar: "bg-zinc-800" };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-bold uppercase tracking-wider ${m.color}`}>{m.label}</span>
        <span className="font-mono text-sm font-semibold text-zinc-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div className={`h-full rounded-full ${m.bar} transition-[width] duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AnalysisView({ analysis, mode, content }) {
  if (!analysis) return null;
  const {
    cefr_level, overall_score, scores = {}, summary,
    grammar_issues = [], word_choice = [], pronunciation = [],
    improved_version, strategic_advice = [],
  } = analysis;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
            <Award size={14} /> Overall
          </div>
          <div className="mt-4">
            <span className="font-heading text-5xl font-bold">{overall_score}</span>
            <span className="text-white/50 text-xl">/100</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-white/50">CEFR</span>
            <span className="font-mono text-sm bg-white/10 px-2.5 py-1 rounded-md">{cefr_level || "—"}</span>
          </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-2xl border border-black/5 p-6 space-y-4">
          {Object.entries(scores).map(([k, v]) => (
            <ScoreBar key={k} k={k} value={v} />
          ))}
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <p className="text-zinc-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {mode === "speaking" && content && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Transcript</p>
          <p className="text-zinc-700 leading-relaxed italic">"{content}"</p>
        </div>
      )}

      {/* Pronunciation with IPA */}
      {mode === "speaking" && pronunciation.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Volume2 className="text-emerald-600" size={20} />
            <h3 className="font-heading font-semibold text-lg text-zinc-900">Pronunciation & IPA</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {pronunciation.map((p, i) => (
              <div key={i} className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-heading font-semibold text-zinc-900">{p.word}</span>
                  <span className="font-mono text-sm tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{p.ipa}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{p.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar */}
      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="text-rose-600" size={20} />
          <h3 className="font-heading font-semibold text-lg text-zinc-900">Grammar</h3>
          <span className="ml-auto font-mono text-xs text-zinc-400">{grammar_issues.length} item(s)</span>
        </div>
        {grammar_issues.length === 0 ? (
          <p className="text-sm text-zinc-500 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No grammar issues detected. Great work!</p>
        ) : (
          <div className="space-y-4">
            {grammar_issues.map((g, i) => (
              <div key={i} className="border-l-2 border-rose-300 pl-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="line-through text-rose-500">{g.original}</span>
                  <ArrowRight size={14} className="text-zinc-400" />
                  <span className="font-medium text-emerald-700">{g.correction}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{g.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Word choice */}
      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="text-violet-700" size={20} />
          <h3 className="font-heading font-semibold text-lg text-zinc-900">Word Choice</h3>
          <span className="ml-auto font-mono text-xs text-zinc-400">{word_choice.length} item(s)</span>
        </div>
        {word_choice.length === 0 ? (
          <p className="text-sm text-zinc-500 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Vocabulary looks appropriate.</p>
        ) : (
          <div className="space-y-4">
            {word_choice.map((w, i) => (
              <div key={i} className="border-l-2 border-violet-300 pl-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-zinc-500">{w.original}</span>
                  <ArrowRight size={14} className="text-zinc-400" />
                  <span className="font-medium text-violet-700">{w.suggestion}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{w.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Improved version (writing) */}
      {improved_version && (
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Polished Version</p>
          <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{improved_version}</p>
        </div>
      )}

      {/* Strategic advice */}
      {strategic_advice.length > 0 && (
        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="text-blue-600" size={20} />
            <h3 className="font-heading font-semibold text-lg text-zinc-900">Strategic Plan to Advance</h3>
          </div>
          <ul className="space-y-3">
            {strategic_advice.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-700">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="leading-relaxed pt-0.5">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

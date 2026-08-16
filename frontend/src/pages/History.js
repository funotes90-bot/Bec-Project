import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, PenLine, Loader2, Trash2, ChevronRight, Bookmark } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    api.get("/sessions").then((r) => setSessions(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/sessions/${id}`);
      setSessions((s) => s.filter((x) => x.id !== id));
      toast.success("Session deleted");
    } catch {
      toast.error("Could not delete");
    }
  };

  const toggleSave = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.patch(`/sessions/${id}/save`);
      setSessions((s) => s.map((x) => (x.id === id ? { ...x, saved: res.data.saved } : x)));
      toast.success(res.data.saved ? "Saved to your collection" : "Removed from saved");
    } catch {
      toast.error("Could not update");
    }
  };

  const filtered = sessions.filter((s) =>
    filter === "all" ? true : filter === "saved" ? s.saved : s.mode === filter
  );

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">History</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Your sessions</h1>
      </div>

      <div className="flex gap-2">
        {["all", "speaking", "writing", "saved"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-[background-color,color] duration-200 ${filter === f ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-900" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-zinc-500">No sessions found.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden divide-y divide-black/5">
          {filtered.map((s) => (
            <Link key={s.id} to={`/session/${s.id}`} data-testid={`session-${s.id}`}
              className="flex items-center gap-4 p-5 hover:bg-zinc-50 transition-[background-color] duration-200 group">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.mode === "speaking" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-700"}`}>
                {s.mode === "speaking" ? <Mic size={18} /> : <PenLine size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 truncate">{(s.content || "").slice(0, 80) || "Session"}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{new Date(s.created_at).toLocaleString()} · {s.cefr_level}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-heading text-2xl font-bold text-zinc-900">{s.overall_score}</p>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400">score</p>
              </div>
              <button onClick={(e) => toggleSave(e, s.id)} data-testid={`save-${s.id}`}
                className={`p-2 transition-[color] duration-200 ${s.saved ? "text-amber-500" : "text-zinc-300 hover:text-amber-500"}`} title={s.saved ? "Saved" : "Save"}>
                <Bookmark size={16} fill={s.saved ? "currentColor" : "none"} />
              </button>
              <button onClick={(e) => remove(e, s.id)} data-testid={`delete-${s.id}`} className="p-2 text-zinc-300 hover:text-rose-500 transition-[color] duration-200">
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-500 transition-[color] duration-200" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

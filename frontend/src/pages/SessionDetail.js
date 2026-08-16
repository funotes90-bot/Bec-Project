import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mic, PenLine } from "lucide-react";
import api from "@/lib/api";
import AnalysisView from "@/components/AnalysisView";

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${id}`).then((r) => setSession(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-900" size={32} /></div>;

  if (!session)
    return <div className="text-center py-20 text-zinc-500">Session not found.</div>;

  return (
    <div className="space-y-8">
      <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-[color] duration-200">
        <ArrowLeft size={16} /> Back to history
      </Link>
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${session.mode === "speaking" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-700"}`}>
          {session.mode === "speaking" ? <Mic size={20} /> : <PenLine size={20} />}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-zinc-900 capitalize">{session.mode} session</h1>
          <p className="text-sm text-zinc-400">{new Date(session.created_at).toLocaleString()}</p>
        </div>
      </div>
      <AnalysisView analysis={session.analysis} mode={session.mode} content={session.transcript || session.content} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, PenLine, TrendingUp, Layers, Award, AlertTriangle, Target, ArrowRight, Loader2, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generateProgressReport } from "@/lib/report";
import { toast } from "sonner";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6">
      <div className="flex items-center gap-2 text-zinc-400 mb-4"><Icon size={18} /><span className="text-xs font-bold uppercase tracking-widest">{label}</span></div>
      <p className="font-heading text-4xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="text-sm text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/progress"), api.get("/sessions")])
      .then(([p, s]) => { setData(p.data); setSessions(s.data); })
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = () => {
    try {
      generateProgressReport({ user, progress: data, sessions });
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Could not generate report");
    }
  };

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-900" size={32} /></div>;

  const empty = !data || data.total_sessions === 0;

  const radarData = () => {
    const s = { ...(data?.speaking_scores || {}), ...(data?.writing_scores || {}) };
    const short = { task_achievement: "Task", pronunciation: "Pron.", vocabulary: "Vocab", coherence: "Cohere", grammar: "Grammar", fluency: "Fluency" };
    return Object.entries(s).map(([k, v]) => ({ skill: short[k] || k.replace(/_/g, " "), value: v }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Dashboard</span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Hi {user?.name?.split(" ")[0]} 👋</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {!empty && (
            <button onClick={downloadReport} data-testid="download-report-btn"
              className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200">
              <Download size={16} /> Download PDF
            </button>
          )}
          <Link to="/speaking" data-testid="quick-speaking" className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200"><Mic size={16} /> Speaking</Link>
          <Link to="/writing" data-testid="quick-writing" className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200"><PenLine size={16} /> Writing</Link>
        </div>
      </div>

      {empty ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-5"><Layers className="text-zinc-500" size={26} /></div>
          <h3 className="font-heading text-xl font-semibold text-zinc-900">No sessions yet</h3>
          <p className="text-zinc-500 mt-2 max-w-sm mx-auto">Record a speaking session or submit a piece of writing to see your progress and personalised feedback here.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Link to="/speaking" className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200"><Mic size={16} /> Start speaking</Link>
            <Link to="/writing" className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200"><PenLine size={16} /> Start writing</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat icon={Award} label="Avg Score" value={data.avg_overall} sub="across all sessions" />
            <Stat icon={TrendingUp} label="CEFR Level" value={data.latest_cefr || "—"} sub="latest estimate" />
            <Stat icon={Mic} label="Speaking" value={data.speaking_count} sub="sessions" />
            <Stat icon={PenLine} label="Writing" value={data.writing_count} sub="sessions" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 p-6">
              <h3 className="font-heading font-semibold text-lg text-zinc-900 mb-6">Score progression</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.timeline.map((t, i) => ({ ...t, idx: i + 1 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="idx" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 13 }} />
                  <Line type="monotone" dataKey="score" stroke="#09090b" strokeWidth={2.5} dot={{ r: 4, fill: "#09090b" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <h3 className="font-heading font-semibold text-lg text-zinc-900 mb-2">Skill breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData()} outerRadius={90}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="skill" fontSize={11} tick={{ fill: "#71717a" }} />
                  <Radar dataKey="value" stroke="#6d28d9" fill="#6d28d9" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-black/5 p-6">
              <div className="flex items-center gap-2 mb-5"><AlertTriangle className="text-rose-600" size={18} /><h3 className="font-heading font-semibold text-lg text-zinc-900">Recurring weaknesses</h3></div>
              {data.top_weaknesses.length === 0 ? (
                <p className="text-sm text-zinc-500">No recurring issues found yet — keep practising!</p>
              ) : (
                <ul className="space-y-3">
                  {data.top_weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-zinc-700 leading-relaxed">{w.issue}</span>
                      <span className="font-mono text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md flex-shrink-0">×{w.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-5"><Target className="text-blue-600" size={18} /><h3 className="font-heading font-semibold text-lg text-zinc-900">Latest strategic advice</h3></div>
              {data.latest_advice.length === 0 ? (
                <p className="text-sm text-zinc-500">Complete a session to receive coaching.</p>
              ) : (
                <ul className="space-y-3">
                  {data.latest_advice.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-700">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="leading-relaxed pt-0.5">{a}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-[color] duration-200">
            View full history <ArrowRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2, Download, Award, Layers, GraduationCap, Search } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generateClassReport } from "@/lib/report";
import { toast } from "sonner";

export default function ClassMode() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const isTeacher = user && (user.role === "admin" || user.role === "teacher");

  useEffect(() => {
    if (!isTeacher) { navigate("/dashboard"); return; }
    api.get("/admin/students")
      .then((r) => setStudents(r.data))
      .catch(() => toast.error("Could not load students"))
      .finally(() => setLoading(false));
  }, [isTeacher, navigate]);

  const download = () => {
    try {
      generateClassReport({ teacher: user, students });
      toast.success("Class report downloaded");
    } catch {
      toast.error("Could not generate report");
    }
  };

  const active = students.filter((s) => s.total_sessions > 0);
  const classAvg = active.length ? Math.round(active.reduce((a, s) => a + s.avg_overall, 0) / active.length) : 0;
  const totalSessions = students.reduce((a, s) => a + s.total_sessions, 0);

  const sorted = [...students].sort(
    (a, b) =>
      (b.total_sessions > 0) - (a.total_sessions > 0) ||
      b.avg_overall - a.avg_overall ||
      a.name.localeCompare(b.name)
  );
  const q = query.trim().toLowerCase();
  const displayed = q
    ? sorted.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    : sorted;

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-900" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Class Mode</span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Student progress</h1>
        </div>
        {students.length > 0 && (
          <button onClick={download} data-testid="download-class-report-btn"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-5 py-2.5 text-sm font-medium transition-[background-color] duration-200">
            <Download size={16} /> Download combined report
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-4"><Users size={18} /><span className="text-xs font-bold uppercase tracking-widest">Students</span></div>
          <p className="font-heading text-4xl font-bold text-zinc-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex items-center gap-2 text-zinc-400 mb-4"><Award size={18} /><span className="text-xs font-bold uppercase tracking-widest">Class Avg</span></div>
          <p className="font-heading text-4xl font-bold text-zinc-900">{classAvg}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-zinc-400 mb-4"><Layers size={18} /><span className="text-xs font-bold uppercase tracking-widest">Total Sessions</span></div>
          <p className="font-heading text-4xl font-bold text-zinc-900">{totalSessions}</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-5"><GraduationCap className="text-zinc-500" size={26} /></div>
          <h3 className="font-heading text-xl font-semibold text-zinc-900">No students yet</h3>
          <p className="text-zinc-500 mt-2 max-w-sm mx-auto">When learners create accounts and practise, their progress will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="p-4 border-b border-black/5">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} data-testid="student-search"
                placeholder="Search by name or email…"
                className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">{displayed.length} shown · active learners first</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3 text-center">Speaking</th>
                  <th className="px-4 py-3 text-center">Writing</th>
                  <th className="px-4 py-3 text-center">Avg</th>
                  <th className="px-4 py-3 text-center">CEFR</th>
                  <th className="px-5 py-3">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {displayed.map((s) => (
                  <tr key={s.id} data-testid={`student-row-${s.id}`} className="hover:bg-zinc-50 transition-[background-color] duration-200">
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-zinc-700">{s.speaking_count}</td>
                    <td className="px-4 py-4 text-center font-mono text-zinc-700">{s.writing_count}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-heading font-bold text-zinc-900">{s.avg_overall}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded-md text-zinc-700">{s.latest_cefr || "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{s.last_active ? new Date(s.last_active).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

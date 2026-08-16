import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Mic, PenLine, History, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/speaking", label: "Speaking", icon: Mic },
  { to: "/writing", label: "Writing", icon: PenLine },
  { to: "/history", label: "History", icon: History },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] grain-bg">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-64 flex-col border-r border-black/5 bg-white">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-6 h-16 border-b border-black/5">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <GraduationCap className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <span className="font-heading font-bold tracking-tight text-zinc-900">BEC Assistant</span>
        </Link>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color] duration-200 ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-black/5">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">{user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-[background-color,color] duration-200"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white/70 backdrop-blur-xl border-b border-black/5">
        <Link to="/dashboard" className="flex items-center gap-2 font-heading font-bold text-zinc-900">
          <GraduationCap size={20} /> BEC
        </Link>
        <button onClick={handleLogout} className="text-zinc-600"><LogOut size={18} /></button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around bg-white/80 backdrop-blur-xl border-t border-black/5 py-2">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${active ? "text-zinc-900" : "text-zinc-400"}`}>
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

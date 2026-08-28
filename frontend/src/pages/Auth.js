import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import becBuilding from "@/assets/bec_building.jpg";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      toast.success("Welcome to BEC Assistant!");
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setMode("login");
    setEmail("demo@bec.app");
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:block relative">
        <img src={becBuilding} alt="BEC Pare building" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-zinc-900/60" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="font-heading text-3xl font-bold leading-tight">Advance your Business English, one session at a time.</h2>
          <p className="mt-3 text-white/70">Grammar · Word choice · Pronunciation with IPA · Strategic coaching.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 flex items-center justify-center">
              <GraduationCap className="text-white" size={20} />
            </div>
            <span className="font-heading font-bold tracking-tight text-zinc-900">BEC Progress Assistant</span>
          </Link>

          <h1 className="font-heading text-3xl font-bold text-zinc-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {mode === "login" ? "Log in to continue your progress." : "Start tracking your English progress today."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium text-zinc-700">Name</label>
                <input data-testid="name-input" value={name} onChange={(e) => setName(e.target.value)} required
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200" placeholder="Jane Doe" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input data-testid="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Password</label>
              <input data-testid="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-[box-shadow] duration-200" placeholder="••••••••" />
            </div>

            {error && <p data-testid="auth-error" className="text-sm text-rose-600">{error}</p>}

            <button type="submit" data-testid="auth-submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-3 font-medium transition-[background-color] duration-200 disabled:opacity-60">
              {loading && <Loader2 className="animate-spin" size={18} />}
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <button onClick={fillDemo} data-testid="demo-fill-btn" className="mt-3 w-full text-sm text-zinc-500 hover:text-zinc-900 transition-[color] duration-200">
            Use demo account
          </button>

          <p className="mt-6 text-sm text-center text-zinc-500">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} data-testid="toggle-mode" className="font-semibold text-zinc-900 hover:underline">
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

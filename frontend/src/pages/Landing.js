import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Mic, PenLine, Activity, Volume2, Sparkles, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import becBuilding from "@/assets/bec_building.jpg";
import becLogo from "@/assets/logo_bec.png";

const features = [
  { icon: Activity, color: "text-rose-600", bg: "bg-rose-50", title: "Grammar Analysis", desc: "Every sentence checked, with corrections and plain-English explanations." },
  { icon: Sparkles, color: "text-violet-700", bg: "bg-violet-50", title: "Word Choice", desc: "Business-appropriate vocabulary suggestions to sharpen your register." },
  { icon: Volume2, color: "text-emerald-600", bg: "bg-emerald-50", title: "Pronunciation + IPA", desc: "Tricky words shown with full IPA phonetic symbols and articulation tips." },
  { icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", title: "Strategic Coaching", desc: "A CEFR estimate plus an actionable plan to level up faster." },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white grain-bg">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={becLogo} alt="Basic English Course logo" className="h-10 w-10 object-contain" />
            <span className="font-heading font-bold tracking-tight text-zinc-900">BEC Progress Assistant</span>
          </div>
          <Link to="/auth" data-testid="header-login-link" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-5 py-2 text-sm font-medium transition-[background-color] duration-200">
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 animate-fade-up">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> BASIC ENGLISH COURSE
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight font-bold text-zinc-900 leading-[1.05]">
            Speak & write English.<br />
            <span className="text-zinc-400">Get instant expert feedback.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed">
            Record your voice or type your writing. In seconds, see exactly where you stand on grammar,
            word choice and pronunciation — complete with IPA phonetic symbols and a strategic plan to advance.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" data-testid="hero-cta" className="inline-flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-3 font-medium transition-[background-color,transform] duration-200 hover:-translate-y-[1px]">
              Start practising <ArrowRight size={18} />
            </Link>
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500 px-2 py-3">
              <Mic size={16} /> Speaking &nbsp;·&nbsp; <PenLine size={16} /> Writing
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="relative rounded-3xl overflow-hidden border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
            <img src={becBuilding} alt="BEC Pare building" className="w-full h-[520px] object-cover object-center" />
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/60">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Pronunciation</p>
              <p className="font-mono text-sm text-emerald-700">negotiation <span className="bg-emerald-50 px-2 py-0.5 rounded-md">/nɪˌɡoʊ.ʃiˈeɪ.ʃən/</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-black/5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="border-r border-b border-black/5 p-8 hover:bg-zinc-50 transition-[background-color] duration-200">
                <div className={`h-11 w-11 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-5`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

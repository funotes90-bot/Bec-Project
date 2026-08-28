import { useRef, useState, useEffect } from "react";
import { Mic, Square, Loader2, Video, RefreshCw, Volume2, Shuffle, Lightbulb } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import AnalysisView from "@/components/AnalysisView";
import { SPEAKING_PROMPTS, SPEAKING_CATEGORIES, promptsForCategory, randomPrompt } from "@/lib/prompts";
import { toast } from "sonner";

export default function Speaking() {
  const [mode, setMode] = useState("audio"); // audio | video
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [category, setCategory] = useState("all");
  const [thinkDuration, setThinkDuration] = useState(10);
  const [prompt, setPrompt] = useState(() => randomPrompt(SPEAKING_PROMPTS));
  const [thinkLeft, setThinkLeft] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const thinkRef = useRef(null);
  const autoStartRef = useRef(false);
  const frameRef = useRef(null);

  useEffect(() => () => { stopStream(); if (thinkRef.current) clearInterval(thinkRef.current); }, []);

  useEffect(() => {
    if (thinkLeft === 0 && autoStartRef.current) {
      autoStartRef.current = false;
      start();
    }
  }, [thinkLeft]);

  const shufflePrompt = () => {
    if (recording || thinkLeft > 0) return;
    setPrompt((p) => randomPrompt(promptsForCategory(SPEAKING_CATEGORIES, category), p));
  };

  const changeCategory = (catId) => {
    if (recording || thinkLeft > 0) return;
    setCategory(catId);
    setPrompt(randomPrompt(promptsForCategory(SPEAKING_CATEGORIES, catId)));
  };

  const prepare = () => {
    if (recording || thinkLeft > 0) return;
    setResult(null);
    setVideoUrl(null);
    autoStartRef.current = true;
    setThinkLeft(thinkDuration);
    thinkRef.current = setInterval(() => {
      setThinkLeft((t) => (t <= 1 ? (clearInterval(thinkRef.current), 0) : t - 1));
    }, 1000);
  };

  const skipThink = () => {
    clearInterval(thinkRef.current);
    autoStartRef.current = false;
    setThinkLeft(0);
    start();
  };

  const stopStream = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    setResult(null);
    setVideoUrl(null);
    frameRef.current = null;
    try {
      const constraints = mode === "video" ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (mode === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = handleStop;
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      toast.error("Could not access microphone/camera. Please allow permission.");
    }
  };

  const captureFrame = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const stop = () => {
    if (mediaRecorderRef.current && recording) {
      if (mode === "video") frameRef.current = captureFrame();
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStop = async () => {
    stopStream();
    const blob = new Blob(chunksRef.current, { type: mode === "video" ? "video/webm" : "audio/webm" });
    if (blob.size < 1000) {
      toast.error("Recording too short. Please speak for a few seconds.");
      return;
    }
    if (mode === "video") setVideoUrl(URL.createObjectURL(blob));
    setAnalyzing(true);
    const form = new FormData();
    form.append("audio", blob, "recording.webm");
    if (frameRef.current) {
      try {
        const fb = await (await fetch(frameRef.current)).blob();
        form.append("frame", fb, "frame.jpg");
      } catch { /* skip frame */ }
    }
    try {
      const res = await api.post("/speaking/analyze", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
      toast.success("Analysis ready!");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Speaking Practice</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">Record & analyse your speaking</h1>
      </div>

      {/* Category selector */}
      {!result && (
        <div className="flex flex-wrap gap-2" data-testid="speaking-categories">
          {[{ id: "all", label: "All Topics" }, ...SPEAKING_CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => changeCategory(c.id)} data-testid={`speaking-cat-${c.id}`}
              disabled={recording || thinkLeft > 0}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-[background-color,color] duration-200 disabled:opacity-40 ${category === c.id ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Prompt card */}
      {!result && (
      <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Volume2 className="text-white" size={18} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Impromptu prompt</p>
          <p className="text-zinc-800 font-medium" data-testid="speaking-prompt">{prompt}</p>
        </div>
        <button onClick={shufflePrompt} data-testid="shuffle-prompt-btn" disabled={recording || thinkLeft > 0}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-[background-color] duration-200 disabled:opacity-40 flex-shrink-0">
          <Shuffle size={14} /> New
        </button>
      </div>
      )}

      {/* Recorder */}
      {!result && (
        <div className="bg-white rounded-2xl border border-black/5 p-8">
          <div className="flex justify-center gap-2 mb-6">
            {["audio", "video"].map((m) => (
              <button key={m} onClick={() => !recording && setMode(m)} data-testid={`mode-${m}`} disabled={recording}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-[background-color,color] duration-200 ${mode === m ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                {m === "audio" ? <Mic size={16} /> : <Video size={16} />} {m === "audio" ? "Audio" : "Video"}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 mb-8" data-testid="think-time-selector">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Thinking time</span>
            <div className="inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1">
              {[5, 10, 15].map((d) => (
                <button key={d} onClick={() => !recording && thinkLeft === 0 && setThinkDuration(d)} data-testid={`think-time-${d}`}
                  disabled={recording || thinkLeft > 0}
                  className={`rounded-full px-4 py-1 text-sm font-medium transition-[background-color,color] duration-200 disabled:opacity-40 ${thinkDuration === d ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {mode === "video" && (
            <div className="max-w-md mx-auto mb-8 rounded-2xl overflow-hidden border border-black/5 bg-zinc-900 aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            {analyzing ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="animate-spin text-zinc-900" size={40} />
                <p className="text-zinc-600">Transcribing & analysing your speech…</p>
              </div>
            ) : thinkLeft > 0 ? (
              <div className="flex flex-col items-center gap-4 py-4" data-testid="think-countdown">
                <div className="h-28 w-28 rounded-full bg-amber-50 ring-4 ring-amber-400/30 flex items-center justify-center animate-rec-pulse">
                  <span className="font-heading text-5xl font-bold text-amber-600">{thinkLeft}</span>
                </div>
                <div className="text-center">
                  <p className="font-heading font-semibold text-zinc-900 flex items-center justify-center gap-2">
                    <Lightbulb size={18} className="text-amber-500" /> Think! Recording starts in {thinkLeft}s
                  </p>
                  <button onClick={skipThink} data-testid="skip-think-btn"
                    className="mt-2 text-sm text-zinc-500 hover:text-zinc-900 transition-[color] duration-200">
                    Skip & record now
                  </button>
                </div>
              </div>
            ) : recording ? (
              <>
                <button onClick={stop} data-testid="stop-recording-btn"
                  className="h-28 w-28 rounded-full flex items-center justify-center bg-rose-50 ring-4 ring-rose-500/20 animate-rec-pulse transition-[transform] duration-200 hover:-translate-y-[2px]">
                  <Square className="text-rose-500" size={36} fill="currentColor" />
                </button>
                <div className="text-center">
                  <p className="font-mono text-2xl font-semibold text-zinc-900">{fmt(seconds)}</p>
                  <p className="text-sm text-zinc-500 mt-1">Recording… tap to stop</p>
                </div>
              </>
            ) : (
              <>
                <button onClick={prepare} data-testid="prepare-btn"
                  className="h-28 w-28 rounded-full flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition-[transform,background-color] duration-200 hover:-translate-y-[2px]">
                  <Mic className="text-white" size={40} />
                </button>
                <div className="text-center">
                  <p className="font-mono text-2xl font-semibold text-zinc-900">{fmt(0)}</p>
                  <p className="text-sm text-zinc-500 mt-1">Tap for {thinkDuration}s thinking time, then recording starts</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {result && (
        <div>
          <button onClick={() => { setResult(null); setSeconds(0); setVideoUrl(null); setPrompt(randomPrompt(promptsForCategory(SPEAKING_CATEGORIES, category))); }} data-testid="new-recording-btn"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mb-6 transition-[color] duration-200">
            <RefreshCw size={16} /> Record another
          </button>
          <AnalysisView analysis={result.analysis} mode="speaking" content={result.transcript} videoUrl={videoUrl} />
        </div>
      )}
    </div>
  );
}

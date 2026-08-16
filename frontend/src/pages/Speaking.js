import { useRef, useState, useEffect } from "react";
import { Mic, Square, Loader2, Video, RefreshCw, Volume2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import AnalysisView from "@/components/AnalysisView";
import { toast } from "sonner";

const PROMPTS = [
  "Describe your current job role and main responsibilities.",
  "Explain a recent business challenge and how you handled it.",
  "Present your opinion on remote versus office work.",
  "Introduce your company and its products to a new client.",
];

export default function Speaking() {
  const [mode, setMode] = useState("audio"); // audio | video
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => stopStream(), []);

  const stopStream = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const start = async () => {
    setResult(null);
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

  const stop = () => {
    if (mediaRecorderRef.current && recording) {
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
    setAnalyzing(true);
    const form = new FormData();
    form.append("audio", blob, mode === "video" ? "recording.webm" : "recording.webm");
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

      {/* Prompt card */}
      <div className="bg-white rounded-2xl border border-black/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <Volume2 className="text-white" size={18} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Speaking prompt</p>
          <p className="text-zinc-800 font-medium">{prompt}</p>
        </div>
      </div>

      {/* Recorder */}
      {!result && (
        <div className="bg-white rounded-2xl border border-black/5 p-8">
          <div className="flex justify-center gap-2 mb-8">
            {["audio", "video"].map((m) => (
              <button key={m} onClick={() => !recording && setMode(m)} data-testid={`mode-${m}`} disabled={recording}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-[background-color,color] duration-200 ${mode === m ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                {m === "audio" ? <Mic size={16} /> : <Video size={16} />} {m === "audio" ? "Audio" : "Video"}
              </button>
            ))}
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
            ) : (
              <>
                <button
                  onClick={recording ? stop : start}
                  data-testid={recording ? "stop-recording-btn" : "start-recording-btn"}
                  className={`h-28 w-28 rounded-full flex items-center justify-center transition-[transform,background-color] duration-200 hover:-translate-y-[2px] ${
                    recording ? "bg-rose-50 ring-4 ring-rose-500/20 animate-rec-pulse" : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
                >
                  {recording ? <Square className="text-rose-500" size={36} fill="currentColor" /> : <Mic className="text-white" size={40} />}
                </button>
                <div className="text-center">
                  <p className="font-mono text-2xl font-semibold text-zinc-900">{fmt(seconds)}</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {recording ? "Recording… tap to stop" : "Tap to start recording"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {result && (
        <div>
          <button onClick={() => { setResult(null); setSeconds(0); }} data-testid="new-recording-btn"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mb-6 transition-[color] duration-200">
            <RefreshCw size={16} /> Record another
          </button>
          <AnalysisView analysis={result.analysis} mode="speaking" content={result.transcript} />
        </div>
      )}
    </div>
  );
}

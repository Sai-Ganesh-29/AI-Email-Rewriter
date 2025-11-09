"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CopyButton from "@/components/CopyButton";
import ThemeToggle from "@/components/ThemeToggle";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { toast, Toaster } from "@/components/Toast";

type Tone = "formal" | "friendly" | "concise" | "apologetic" | "persuasive";
const TONES: Tone[] = ["formal", "friendly", "concise", "apologetic", "persuasive"];

type ModelId = "openai/gpt-4o-mini" | "anthropic/claude-3.5-haiku" | "google/gemini-1.5-flash";
const MODELS: { id: ModelId; label: string }[] = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku" },
  { id: "google/gemini-1.5-flash", label: "Gemini 1.5 Flash" }
];

type HistoryItem = {
  id: string;
  createdAt: number;
  tone: Tone;
  keepLength: boolean;
  model: ModelId;
  input: string;
  output: string;
};

export default function Page() {
  const [email, setEmail] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [keepLength, setKeepLength] = useState(false);
  const [model, setModel] = useLocalStorage<ModelId>("ui:model", "openai/gpt-4o-mini");
  const [rewritten, setRewritten] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [lengthPct, setLengthPct] = useState(50); // UI hint only (shorter <-> longer)
  const [history, setHistory] = useLocalStorage<HistoryItem[]>("ui:history", []);
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Stats
  const words = useMemo(() => (email.trim() ? email.trim().split(/\s+/).length : 0), [email]);
  const chars = email.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please paste an email to rewrite.");
      return;
    }
    setLoading(true);
    setRewritten("");
    try {
      // Send hints to API (tone/keepLength); model is picked server-side via OpenRouter ID in env or you can forward it.
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-model": model },
        body: JSON.stringify({ email, tone, keepLength })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");

      setRewritten(data.rewritten);
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        tone,
        keepLength,
        model,
        input: email,
        output: data.rewritten
      };
      setHistory((prev) => [item, ...prev].slice(0, 15));
      toast.success("Rewrite complete ✨");
    } catch (err: any) {
      setRewritten(`⚠️ ${err.message || "Something went wrong."}`);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(item: HistoryItem) {
    setEmail(item.input);
    setTone(item.tone);
    setKeepLength(item.keepLength);
    setModel(item.model);
    setRewritten(item.output);
    toast.info("Loaded from history");
  }

  function clearAll() {
    setEmail("");
    setRewritten("");
    editorRef.current?.focus();
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-rewriter-history-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100">
      <Toaster />
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur dark:bg-gray-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
              aria-label="Toggle history"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold">Smart Email Rewriter</h1>
            <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
              Modern UI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs text-gray-500">Model</span>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as ModelId)}
                className="rounded-md border bg-white px-2 py-1 text-sm dark:bg-gray-950"
                title="Choose provider model (OpenRouter ID)"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside
          className={`overflow-hidden rounded-2xl border bg-white dark:bg-gray-950 transition-[max-height] md:transition-none ${
            historyOpen ? "max-h-[600px] md:max-h-none" : "max-h-0 md:max-h-none md:hidden"
          }`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">History</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm("Clear history?")) setHistory([]);
                }}
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Clear
              </button>
              <button
                onClick={exportHistory}
                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Export
              </button>
            </div>
          </div>
          <div className="max-h-[65vh] space-y-0.5 overflow-y-auto p-2">
            {history.length === 0 ? (
              <p className="px-2 py-3 text-xs text-gray-500">No history yet. Your last 15 rewrites appear here.</p>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadFromHistory(h)}
                  className="group block w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium line-clamp-1">{h.input.slice(0, 40) || "Untitled"}</span>
                    <span className="rounded-md border px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-300">
                      {h.tone}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                    <span className="truncate">{MODELS.find((m) => m.id === h.model)?.label}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Editor + Output */}
        <section className="space-y-4">
          <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl border bg-white p-4 dark:bg-gray-950">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm text-gray-500">Tone:</div>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-full border px-3 py-1 text-sm capitalize ${
                      tone === t ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="ml-auto inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={keepLength}
                  onChange={(e) => setKeepLength(e.target.checked)}
                />
                Keep similar length
              </label>
            </div>

            <div className="mt-3">
              <AutoResizeTextarea
                ref={editorRef}
                value={email}
                onChange={(v) => setEmail(v)}
                placeholder="Paste your email here... (Tip: Press Ctrl/Cmd + Enter to rewrite)"
                minRows={10}
                className="w-full resize-none rounded-xl border bg-white/80 px-3 py-3 outline-none focus:ring-2 focus:ring-black/10 dark:bg-gray-950"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>{words} words</span>
                  <span>{chars}/16000 chars</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Shorter</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={lengthPct}
                    onChange={(e) => setLengthPct(parseInt(e.target.value, 10))}
                  />
                  <span>Longer</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Rewriting…" : "Rewrite"}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Reset
              </button>
              <div className="text-xs text-gray-500">
                Shortcut: <kbd className="rounded border px-1">Ctrl/Cmd</kbd> + <kbd className="rounded border px-1">Enter</kbd>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border bg-white p-4 dark:bg-gray-950">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">Rewritten Email</h2>
              {rewritten ? <CopyButton text={rewritten} /> : null}
            </div>
            <div
              className={`min-h-[120px] whitespace-pre-wrap rounded-xl border bg-white/70 p-4 dark:bg-gray-950 ${
                loading ? "animate-pulse" : ""
              }`}
            >
              {loading ? "Generating a polished rewrite…" : rewritten || "Your result will appear here."}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-xs text-gray-500">
        Built with Next.js + OpenRouter.
      </footer>
    </div>
  );
}

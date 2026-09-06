"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Post } from "@/lib/types";

const LIMIT = 500;

export default function Composer({ nick, onPosted }: { nick: string; onPosted: (p: Post) => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const left = LIMIT - body.length;

  async function publish() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { post } = await api.createPost(text, nick);
      setBody("");
      onPosted(post);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Пост не ушёл. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="notch panel p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, LIMIT))}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && publish()}
        rows={3}
        placeholder="Что происходит в проде?"
        aria-label="Текст поста"
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <span className="font-mono text-[11px] text-muted">
          #хэштеги работают · ⌘↵ отправляет
        </span>
        <span className={`ml-auto font-mono text-[11px] ${left < 40 ? "text-danger" : "text-muted"}`}>
          {left}
        </span>
        <button
          onClick={publish}
          disabled={!body.trim() || busy}
          className="notch notch-sm bg-accent px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-black transition-opacity disabled:opacity-30"
        >
          {busy ? "Отправляем…" : "Опубликовать"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 font-mono text-[11px] text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

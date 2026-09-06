"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { byId } from "@/lib/factions";
import type { Post } from "@/lib/types";

const LIMIT = 500;

type Props = { nick: string; faction?: string; onPosted: (p: Post) => void };

export default function Composer({ nick, faction, onPosted }: Props) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const left = LIMIT - body.length;
  const side = byId(faction ?? "vibe");

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
    <section className="card p-3.5">
      <div className="flex gap-3">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[15px]"
          style={{ background: `${side.accent}26` }}
        >
          {side.emoji}
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, LIMIT))}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && publish()}
          rows={3}
          placeholder="Что происходит в проде?"
          aria-label="Текст поста"
          className="min-w-0 flex-1 resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-muted"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[12px] text-muted">
        <span>#хэштеги работают · ⌘↵ отправляет</span>
        <span className={`ml-auto ${left < 40 ? "text-danger" : "text-muted"}`}>{left}</span>
        <button
          onClick={publish}
          disabled={!body.trim() || busy}
          className="btn-brand px-5 py-2 text-[12px] uppercase"
        >
          {busy ? "Отправляем…" : "Опубликовать"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

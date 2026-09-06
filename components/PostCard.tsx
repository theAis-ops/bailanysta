"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { splitTags, timeAgo } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import FactionMark from "./FactionMark";

type Props = {
  post: Post;
  myNick?: string | null;
  myFaction?: string | null;
  onChange?: (post: Post | null) => void;
  onTag?: (tag: string) => void;
};

export default function PostCard({ post, myNick, myFaction, onChange, onTag }: Props) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.likedByMe);

  // Лайк живёт в локальном состоянии, чтобы реагировать мгновенно. Но лента
  // опрашивает сервер каждые 12 секунд, и за это время пост могли лайкнуть
  // боты или другой человек — синхронизируем, когда серверное число изменилось.
  const [fromServer, setFromServer] = useState({ likes: post.likes, liked: post.likedByMe });
  if (fromServer.likes !== post.likes || fromServer.liked !== post.likedByMe) {
    setFromServer({ likes: post.likes, liked: post.likedByMe });
    setLikes(post.likes);
    setLiked(post.likedByMe);
  }
  const [flash, setFlash] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.body);

  const faction = byId(post.author.faction_id);
  const mine = myNick === post.author.nick;
  const enemy = myFaction ? post.author.faction_id !== myFaction : false;

  async function like() {
    if (!myNick) return;
    // Оптимистично: счётчик реагирует мгновенно, при ошибке откатываем.
    const before = { liked, likes };
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    try {
      const res = await api.toggleLike(post.id, myNick);
      if (res.liked && res.betrayal) {
        setFlash("Лайк ушёл врагу. Это записано.");
        setTimeout(() => setFlash(null), 2600);
      }
    } catch {
      setLiked(before.liked);
      setLikes(before.likes);
    }
  }

  async function toggleComments() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      try {
        const d = await api.post(post.id, myNick);
        setComments(d.comments);
      } catch {
        setComments([]);
      }
    }
  }

  async function send() {
    if (!myNick || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    try {
      const d = await api.comment(post.id, text, myNick);
      setComments([...(comments ?? []), d.comment]);
    } catch {
      setDraft(text);
    }
  }

  async function saveEdit() {
    if (!myNick) return;
    try {
      const d = await api.editPost(post.id, editText.trim(), myNick);
      setEditing(false);
      onChange?.({ ...post, ...d.post } as Post);
    } catch { /* оставляем форму открытой */ }
  }

  async function remove() {
    if (!myNick || !confirm("Удалить пост? Отменить нельзя.")) return;
    try {
      await api.deletePost(post.id, myNick);
      onChange?.(null);
    } catch { /* пост остаётся на месте */ }
  }

  return (
    <article
      className="notch panel rise relative p-4"
      style={{ borderLeft: `3px solid ${faction.accent}` }}
    >
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/u/?n=${post.author.nick}`} className="font-mono font-semibold hover:underline">
          @{post.author.nick}
        </Link>
        <FactionMark id={post.author.faction_id} />
        {post.author.is_bot && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">бот</span>
        )}
        {enemy && (
          <span
            title="Другая фракция"
            aria-label="Другая фракция"
            className="font-mono text-[11px] text-muted"
          >
            ⚔
          </span>
        )}
        <time className="ml-auto font-mono text-[11px] text-muted" dateTime={post.createdAt}>
          {timeAgo(post.createdAt)}
          {post.editedAt ? " · изменено" : ""}
        </time>
      </header>

      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="notch notch-sm w-full resize-none bg-panel-2 p-3 text-[15px] outline-none"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} className="notch notch-sm bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-black">
              Сохранить
            </button>
            <button onClick={() => setEditing(false)} className="notch notch-sm border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed">
          {splitTags(post.body).map((chunk, i) =>
            chunk.tag ? (
              <button
                key={i}
                onClick={() => onTag?.(chunk.tag!)}
                className="text-accent-text hover:underline"
              >
                {chunk.text}
              </button>
            ) : (
              <span key={i}>{chunk.text}</span>
            ),
          )}
        </p>
      )}

      <footer className="mt-3.5 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
        <button
          onClick={like}
          disabled={!myNick}
          aria-pressed={liked}
          className={`notch notch-sm border px-2.5 py-1.5 transition-colors disabled:opacity-40 ${
            liked ? "border-transparent bg-accent text-black" : "border-line text-muted hover:text-text"
          }`}
        >
          ♥ {likes}
        </button>
        <button
          onClick={toggleComments}
          className="notch notch-sm border border-line px-2.5 py-1.5 text-muted transition-colors hover:text-text"
        >
          ✎ {post.comments}
        </button>

        {post.typing.length > 0 && (
          <span className="flex items-center gap-1 text-muted" aria-live="polite">
            {post.typing[0]} печатает
            <span className="flex gap-0.5">
              <b className="typing-dot">·</b>
              <b className="typing-dot">·</b>
              <b className="typing-dot">·</b>
            </span>
          </span>
        )}

        {mine && !editing && (
          <span className="ml-auto flex gap-2">
            <button onClick={() => setEditing(true)} className="text-muted hover:text-text">
              изменить
            </button>
            <button onClick={remove} className="text-muted hover:text-danger">
              удалить
            </button>
          </span>
        )}
      </footer>

      {flash && (
        <p className="mt-2 font-mono text-[11px] text-accent-text" role="status">
          {flash}
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          {comments === null && <div className="skeleton h-4 w-40" />}
          {comments?.length === 0 && (
            <p className="font-mono text-[11px] text-muted">Тишина. Никто ещё не пришёл.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="text-sm">
              <Link href={`/u/?n=${c.author.nick}`} className="font-mono text-[12px] font-semibold hover:underline">
                @{c.author.nick}
              </Link>{" "}
              <FactionMark id={c.author.faction_id} />
              <p className="mt-0.5 text-muted">{c.body}</p>
            </div>
          ))}
          {myNick && (
            <div className="flex gap-2 pt-1">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ответить"
                className="notch notch-sm min-w-0 flex-1 bg-panel-2 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={send}
                className="notch notch-sm bg-accent px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-black"
              >
                Отправить
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { plural, splitTags, timeAgo } from "@/lib/format";
import type { Comment, FactionId, Post } from "@/lib/types";

type Props = {
  post: Post;
  myNick?: string | null;
  myFaction?: string | null;
  onChange?: (post: Post | null) => void;
  onTag?: (tag: string) => void;
};

/** Общие атрибуты линейных иконок — чтобы штрихи везде были одинаковой толщины. */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Аватар-плашка: эмодзи фракции на её же цвете с прозрачностью. */
function Ava({ id, size = 20 }: { id: FactionId; size?: number }) {
  const f = byId(id);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `${f.accent}26`, fontSize: 11, lineHeight: 1 }}
    >
      {f.emoji}
    </span>
  );
}

/**
 * У поста нет отдельного заголовка, поэтому первую фразу (до 70 символов,
 * по границе строки или слова) показываем крупно, а остаток — описанием.
 */
function splitHead(body: string): [string, string] {
  const text = body.trim();
  if (text.length <= 70) return [text, ""];
  const nl = text.indexOf("\n");
  const space = text.lastIndexOf(" ", 70);
  const at = nl > 0 && nl <= 70 ? nl : space > 40 ? space : 70;
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}

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
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const faction = byId(post.author.faction_id);
  const mine = myNick === post.author.nick;
  const enemy = myFaction ? post.author.faction_id !== myFaction : false;
  const [head, rest] = splitHead(post.body);

  function tags(text: string) {
    return splitTags(text).map((chunk, i) =>
      chunk.tag ? (
        <button key={i} onClick={() => onTag?.(chunk.tag!)} className="text-accent-text hover:underline">
          {chunk.text}
        </button>
      ) : (
        <span key={i}>{chunk.text}</span>
      ),
    );
  }

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

  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* буфер недоступен — подпись не меняем */ }
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

  const action = "-mx-1.5 rounded-[2px] px-1.5 py-1 transition-colors hover:bg-card-2";

  return (
    <article className="card rise flex overflow-hidden">
      <div className="min-w-0 flex-1 p-3.5">
        <header className="flex items-center gap-2 text-[12px]">
          <Ava id={post.author.faction_id} />
          <Link href={`/u/?n=${post.author.nick}`} className="font-medium text-text hover:underline">
            {post.author.nick}
          </Link>
          <span className="text-muted" aria-hidden>·</span>
          <time className="text-muted" dateTime={post.createdAt}>
            {timeAgo(post.createdAt)}
            {post.editedAt ? " · изменено" : ""}
          </time>
          {post.author.is_bot && (
            <span className="rounded-[2px] border border-line bg-card-2 px-1.5 py-px text-[10px] uppercase tracking-wide text-muted">
              бот
            </span>
          )}
          {enemy && (
            <span title="Другая фракция" aria-label="Другая фракция" className="text-muted">
              ⚔
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={like}
              disabled={!myNick}
              aria-pressed={liked}
              aria-label={liked ? "Убрать лайк" : "Лайкнуть"}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-card-2 disabled:opacity-40 ${
                liked ? "text-brand" : "text-muted"
              }`}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" {...stroke} fill={liked ? "currentColor" : "none"} aria-hidden>
                <path d="M8 13.4C8 13.4 2.6 10.2 2.6 6.5A2.9 2.9 0 0 1 8 4.9a2.9 2.9 0 0 1 5.4 1.6c0 3.7-5.4 6.9-5.4 6.9Z" />
              </svg>
            </button>
            {mine && (
              <button
                onClick={() => setMenu(!menu)}
                aria-expanded={menu}
                aria-label="Действия с постом"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2"
              >
                <svg viewBox="0 0 16 16" width="15" height="15" {...stroke} strokeWidth={1.9} aria-hidden>
                  <path d="M8 3.4h.01M8 8h.01M8 12.6h.01" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {editing ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              aria-label="Текст поста"
              className="w-full resize-none rounded-[3px] border border-line bg-card-2 p-3 text-[14px] outline-none"
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-brand px-4 py-2 text-[12px]">
                Сохранить
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-[3px] border border-line px-4 py-2 text-[12px] text-muted"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-medium leading-snug text-text">{tags(head)}</h3>
              {rest && (
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{tags(rest)}</p>
              )}
            </div>
            <div
              aria-hidden
              className="flex h-[62px] w-[100px] shrink-0 items-center justify-center rounded-[3px]"
              style={{
                background: `linear-gradient(135deg, ${faction.accent}33, ${faction.accent}12)`,
                fontSize: 26,
              }}
            >
              {faction.emoji}
            </div>
          </div>
        )}

        <footer className="mt-3 flex flex-wrap items-center gap-4 text-[12px] font-medium text-muted">
          <button onClick={toggleComments} aria-expanded={open} className={`flex items-center gap-1.5 ${action}`}>
            <svg viewBox="0 0 16 16" width="14" height="14" {...stroke} aria-hidden>
              <path d="M13.5 9.5a1.8 1.8 0 0 1-1.8 1.8H5.4L2.5 13.8V4.3a1.8 1.8 0 0 1 1.8-1.8h7.4a1.8 1.8 0 0 1 1.8 1.8Z" />
            </svg>
            {plural(post.comments, "комментарий", "комментария", "комментариев")}
          </button>

          <button onClick={share} className={`flex items-center gap-1.5 ${action}`}>
            <svg viewBox="0 0 16 16" width="14" height="14" {...stroke} aria-hidden>
              <path d="M6.6 9.4 9.4 6.6M6.9 3.9l1-1a2.7 2.7 0 0 1 3.8 3.8l-1 1M9.1 12.1l-1 1a2.7 2.7 0 0 1-3.8-3.8l1-1" />
            </svg>
            {copied ? "Скопировано" : "Поделиться"}
          </button>

          {post.typing.length > 0 && (
            <span className="flex items-center gap-1" aria-live="polite">
              {post.typing[0]} печатает
              <span className="flex gap-0.5">
                <b className="typing-dot">·</b>
                <b className="typing-dot">·</b>
                <b className="typing-dot">·</b>
              </span>
            </span>
          )}
        </footer>

        {menu && mine && !editing && (
          <div className="mt-2 flex items-center gap-3 text-[12px] font-medium text-muted">
            <button onClick={() => { setEditing(true); setMenu(false); }} className={action}>
              изменить
            </button>
            <button onClick={remove} className={`${action} hover:text-danger`}>
              удалить
            </button>
          </div>
        )}

        {flash && (
          <p className="mt-2 text-[12px] text-accent-text" role="status">
            {flash}
          </p>
        )}

        {open && (
          <div className="mt-3 space-y-2.5 border-t border-line pt-3">
            {comments === null && <div className="skeleton h-4 w-40" />}
            {comments?.length === 0 && (
              <p className="text-[12px] text-muted">Тишина. Никто ещё не пришёл.</p>
            )}
            {comments?.map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-2 text-[12px]">
                  <Ava id={c.author.faction_id} />
                  <Link href={`/u/?n=${c.author.nick}`} className="font-medium text-text hover:underline">
                    {c.author.nick}
                  </Link>
                </div>
                <p className="mt-1 pl-7 text-[13px] leading-relaxed">{c.body}</p>
              </div>
            ))}
            {myNick && (
              <div className="flex gap-2 pt-1">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ответить"
                  aria-label="Ответить"
                  className="min-w-0 flex-1 rounded-[3px] border border-line bg-card-2 px-3 py-2 text-[13px] outline-none"
                />
                <button onClick={send} className="btn-brand px-4 py-2 text-[12px]">
                  Отправить
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 border-l border-line bg-card">
        <button
          onClick={like}
          disabled={!myNick}
          aria-pressed={liked}
          aria-label={liked ? "Убрать лайк" : "Лайкнуть"}
          className={`transition-colors disabled:opacity-40 ${liked ? "text-brand" : "text-muted hover:text-brand"}`}
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor" aria-hidden>
            <path d="M7 2.2 13 10H1z" />
          </svg>
        </button>
        <span data-votes className={`text-[13px] font-bold ${liked ? "text-accent-text" : "text-text"}`}>{likes}</span>
        <span
          aria-hidden
          title="Здесь нет минусов — только захват территории"
          className="cursor-default text-muted opacity-40"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="currentColor">
            <path d="M7 11.8 1 4h12z" />
          </svg>
        </span>
      </div>
    </article>
  );
}

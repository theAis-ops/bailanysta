"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { readSession, useSession } from "@/lib/session";
import type { Post } from "@/lib/types";

const SCOPES = [
  { id: "all", label: "Весь мир" },
  { id: "faction", label: "Моя фракция" },
  { id: "enemy", label: "Территория врага" },
];

export default function Feed() {
  const router = useRouter();
  const session = useSession();
  const nick = session?.nick ?? null;

  const [scope, setScope] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Смена фильтра сбрасывает ленту в скелетоны прямо во время рендера —
  // так React советует сбрасывать производное состояние, без лишнего эффекта.
  const queryKey = `${scope}|${tag ?? ""}|${search}`;
  const [shownKey, setShownKey] = useState(queryKey);
  if (shownKey !== queryKey) {
    setShownKey(queryKey);
    setPosts(null);
  }

  // Решение о редиректе принимаем по хранилищу, а не по значению из рендера:
  // сразу после вступления стор ещё может отдавать пустую сессию, и гость,
  // который только что выбрал сторону, улетал обратно на экран выбора.
  useEffect(() => {
    if (!readSession()) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!nick) return;
    let alive = true;
    const pull = () =>
      api
        .feed({ scope, tag: tag ?? undefined, q: search || undefined }, nick)
        .then((d) => {
          if (!alive) return;
          setPosts(d.posts);
          setCursor(d.nextCursor);
          setError(null);
        })
        .catch(() => {
          if (alive) setError("Лента не загрузилась. Проверь соединение и обнови страницу.");
        });

    pull();
    // Боты отвечают с задержкой, поэтому лента сама подтягивает новое.
    const timer = setInterval(pull, 12_000);
    return () => { alive = false; clearInterval(timer); };
  }, [nick, scope, tag, search]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await api.feed(
        { scope, tag: tag ?? undefined, q: search || undefined, cursor },
        nick,
      );
      setPosts([...(posts ?? []), ...d.posts]);
      setCursor(d.nextCursor);
    } catch {
      /* кнопка остаётся на месте — можно повторить */
    } finally {
      setLoadingMore(false);
    }
  }

  if (!session) return <FeedSkeleton />;

  return (
    <div className="space-y-4">
      <Composer nick={session.nick} onPosted={(p) => setPosts([p, ...(posts ?? [])])} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 font-mono text-[11px] uppercase tracking-wider">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              aria-pressed={scope === s.id}
              className={`notch notch-sm border px-2.5 py-1.5 transition-colors ${
                scope === s.id
                  ? "border-transparent bg-accent text-black"
                  : "border-line text-muted hover:text-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по постам"
          aria-label="Поиск по постам"
          className="notch notch-sm ml-auto min-w-0 flex-1 border border-line bg-panel px-3 py-1.5 font-mono text-xs outline-none sm:max-w-52"
        />
      </div>

      {tag && (
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-muted">разведка по метке</span>
          <button
            onClick={() => setTag(null)}
            className="notch notch-sm bg-accent px-2.5 py-1 uppercase tracking-wider text-black"
          >
            #{tag} ✕
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="notch panel p-4 font-mono text-xs text-danger">
          {error}
        </p>
      )}

      {posts === null && <FeedSkeleton />}

      {posts?.length === 0 && (
        <div className="notch panel p-8 text-center">
          <p className="font-display text-lg font-bold">Здесь пока тихо</p>
          <p className="mt-2 text-sm text-muted">
            Напиши первым. Свои поддержат, враги придут — так и работает.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {posts?.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            myNick={session.nick}
            myFaction={session.faction}
            onTag={setTag}
            onChange={(next) =>
              setPosts((cur) =>
                next
                  ? (cur ?? []).map((x) => (x.id === p.id ? { ...x, ...next } : x))
                  : (cur ?? []).filter((x) => x.id !== p.id),
              )
            }
          />
        ))}
      </div>

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="notch notch-sm w-full border border-line py-3 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-text"
        >
          {loadingMore ? "Грузим…" : "Показать ещё"}
        </button>
      )}
    </div>
  );
}

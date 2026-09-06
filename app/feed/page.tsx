"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { SCOPES, setScope, useScope } from "@/lib/feedScope";
import { readSession, useSession } from "@/lib/session";
import type { Post } from "@/lib/types";

export default function Feed() {
  const router = useRouter();
  const session = useSession();
  const scope = useScope();
  const nick = session?.nick ?? null;

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

  useEffect(() => {
    if (!readSession()) router.replace("/");
  }, [router]);

  // Поиск живёт в шапке, а результаты показывает лента — связываем событием.
  useEffect(() => {
    const onSearch = (e: Event) => setSearch((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("bailanysta:search", onSearch);
    return () => window.removeEventListener("bailanysta:search", onSearch);
  }, []);

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

  const title = SCOPES.find((s) => s.id === scope)?.label ?? "Лента";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[20px] font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-1 rounded-[3px] border border-line bg-card p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              aria-pressed={scope === s.id}
              className={`rounded-[2px] px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                scope === s.id ? "bg-brand text-white" : "text-muted hover:text-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {(tag || search) && (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-muted">{tag ? "разведка по метке" : "поиск"}</span>
          <button
            onClick={() => { setTag(null); setSearch(""); }}
            className="rounded-[3px] bg-brand px-2.5 py-1 font-medium text-white"
          >
            {tag ? `#${tag}` : search} ✕
          </button>
        </div>
      )}

      <Composer
        nick={session.nick}
        faction={session.faction}
        onPosted={(p) => setPosts([p, ...(posts ?? [])])}
      />

      {error && (
        <p role="alert" className="card p-4 text-[13px] text-danger">
          {error}
        </p>
      )}

      {posts === null && <FeedSkeleton />}

      {posts?.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-[16px] font-semibold">Здесь пока тихо</p>
          <p className="mt-1.5 text-[13px] text-muted">
            Напиши первым. Свои поддержат, враги придут — так и работает.
          </p>
        </div>
      )}

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

      {cursor && (
        <div className="pt-3 text-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn-brand px-10 py-2.5 text-[12px] uppercase">
            {loadingMore ? "Грузим…" : "Показать ещё"}
          </button>
        </div>
      )}
    </div>
  );
}

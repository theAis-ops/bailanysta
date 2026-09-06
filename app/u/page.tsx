"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import FactionMark from "@/components/FactionMark";
import PostCard from "@/components/PostCard";
import { FeedSkeleton } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { timeAgo } from "@/lib/format";
import { clearSession, useSession } from "@/lib/session";
import type { Notification, Post, Stats, User } from "@/lib/types";

function alertText(n: Notification): string {
  if (n.kind === "like") return `@${n.payload.from} поддержал твой пост`;
  if (n.kind === "comment") return `@${n.payload.from} пришёл в комментарии`;
  return "Сводка с фронта";
}

function Profile() {
  const params = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const myNick = session?.nick ?? null;
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const target = params.get("n") ?? myNick ?? "";
  const mine = !!myNick && target === myNick;

  // Флаг alive защищает от гонки: если пользователь успел уйти на другой
  // профиль, ответ по старому запросу уже никого не интересует.
  useEffect(() => {
    if (!target) return;
    let alive = true;
    api
      .profile(target, myNick)
      .then((d) => {
        if (!alive) return;
        setUser(d.user);
        setPosts(d.posts);
        setStats(d.stats);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setError("Такого бойца нет. Проверь позывной.");
        setPosts([]);
      });
    return () => { alive = false; };
  }, [target, myNick]);

  useEffect(() => {
    if (!mine || !myNick) return;
    api.notifications(myNick).then((d) => setAlerts(d.notifications)).catch(() => {});
  }, [mine, myNick]);

  if (error) {
    return (
      <div className="notch panel p-8 text-center">
        <p className="font-display text-lg font-bold">{error}</p>
        <Link href="/feed" className="mt-3 inline-block font-mono text-xs text-accent-text underline">
          вернуться в ленту
        </Link>
      </div>
    );
  }

  if (!user || !stats) return <FeedSkeleton />;

  const faction = byId(user.faction_id);

  return (
    <div className="space-y-6">
      <header className="notch panel p-5" style={{ borderLeft: `3px solid ${faction.accent}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-3xl" aria-hidden>{faction.emoji}</span>
          <h1 className="font-display text-2xl font-extrabold">@{user.nick}</h1>
          <FactionMark id={user.faction_id} showName />
          {user.is_bot && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">бот</span>
          )}
        </div>
        {user.bio && <p className="mt-2 text-sm text-muted">{user.bio}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Ранг", v: stats.rank, accent: true },
            { k: "Постов", v: stats.posts },
            { k: "Вклад", v: stats.contribution },
            { k: "Предательств", v: stats.betrayals },
          ].map((s) => (
            <div key={s.k} className="notch notch-sm bg-panel-2 p-3">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{s.k}</dt>
              <dd
                className="mt-1 font-display text-lg font-bold"
                style={s.accent ? { color: faction.accent } : undefined}
              >
                {s.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 font-mono text-[11px] text-muted">
          в строю с {new Date(user.created_at).toLocaleDateString("ru-RU")}
          {stats.betrayals > 0 && " · лайкает врагов, но мы никому не скажем"}
        </p>

        {mine && (
          <button
            onClick={() => { clearSession(); router.push("/"); }}
            className="notch notch-sm mt-4 border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-danger"
          >
            Сменить сторону
          </button>
        )}
      </header>

      {mine && alerts.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">Сводки с фронта</h2>
          <ul className="mt-2 divide-y divide-line border border-line">
            {alerts.slice(0, 8).map((n) => (
              <li key={n.id} className="flex gap-3 px-3 py-2 text-sm">
                <span>{alertText(n)}</span>
                <time className="ml-auto font-mono text-[11px] text-muted">{timeAgo(n.created_at)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Посты</h2>
        {posts === null && <FeedSkeleton count={2} />}
        {posts?.length === 0 && (
          <p className="notch panel p-6 text-center text-sm text-muted">Здесь ещё пусто.</p>
        )}
        {posts?.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            myNick={myNick}
            myFaction={session?.faction}
            onChange={(next) =>
              setPosts((cur) =>
                next
                  ? (cur ?? []).map((x) => (x.id === p.id ? { ...x, ...next } : x))
                  : (cur ?? []).filter((x) => x.id !== p.id),
              )
            }
          />
        ))}
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <Profile />
    </Suspense>
  );
}

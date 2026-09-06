"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Composer from "@/components/Composer";
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

/** Пустой экран и экран ошибки выглядят одинаково: заголовок, пояснение, выход. */
function Notice({
  title,
  hint,
  href,
  action,
}: {
  title: string;
  hint: string;
  href: string;
  action: string;
}) {
  return (
    <div className="card p-8 text-center">
      <p className="text-[16px] font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>
      <Link href={href} className="mt-3 inline-block text-[13px] font-semibold text-brand hover:underline">
        {action}
      </Link>
    </div>
  );
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
        setError("Проверь позывной — в списках такого нет.");
        setPosts([]);
      });
    return () => { alive = false; };
  }, [target, myNick]);

  useEffect(() => {
    if (!mine || !myNick) return;
    api.notifications(myNick).then((d) => setAlerts(d.notifications)).catch(() => {});
  }, [mine, myNick]);

  if (!target) {
    return (
      <Notice
        title="Профиль не выбран"
        hint="Открой чей-нибудь профиль из ленты или выбери сторону, чтобы завести свой."
        href="/"
        action="Выбрать фракцию"
      />
    );
  }

  if (error) {
    return <Notice title="Боец не найден" hint={error} href="/feed" action="Вернуться в ленту" />;
  }

  if (!user || !stats) return <FeedSkeleton />;

  const faction = byId(user.faction_id);

  return (
    <div className="space-y-4">
      <header className="card p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] text-[28px]"
            style={{ background: `${faction.accent}1f` }}
          >
            {faction.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold wrap-anywhere">@{user.nick}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium" style={{ color: faction.accent }}>
                {faction.name}
              </span>
              {user.is_bot && (
                <span className="rounded-[3px] border border-line px-1.5 py-0.5 text-[11px] text-muted">
                  бот
                </span>
              )}
            </div>
          </div>
        </div>

        {user.bio && <p className="mt-3 text-[13px] text-muted">{user.bio}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Ранг", v: stats.rank, accent: true },
            { k: "Постов", v: stats.posts },
            { k: "Вклад", v: stats.contribution },
            { k: "Предательств", v: stats.betrayals },
          ].map((s) => (
            <div key={s.k} className="rounded-[3px] border border-line bg-card-2 p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted">{s.k}</dt>
              <dd
                className="mt-1 text-[17px] font-bold"
                style={s.accent ? { color: faction.accent } : undefined}
              >
                {s.v}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-[12px] text-muted">
          в строю с {new Date(user.created_at).toLocaleDateString("ru-RU")}
          {stats.betrayals > 0 && " · лайкает врагов, но мы никому не скажем"}
        </p>

        {mine && (
          <button
            onClick={() => { clearSession(); router.push("/"); }}
            className="mt-4 rounded-[3px] border border-line px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-danger hover:text-danger"
          >
            Сменить сторону
          </button>
        )}
      </header>

      {mine && alerts.length > 0 && (
        <section className="card">
          <h2 className="border-b border-line p-4 text-[15px] font-semibold">Сводки с фронта</h2>
          <ul className="divide-y divide-line">
            {alerts.slice(0, 8).map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-2.5 text-[13px]">
                <span>{alertText(n)}</span>
                <time className="ml-auto shrink-0 text-[12px] text-muted">{timeAgo(n.created_at)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mine && myNick && (
        <Composer
          nick={myNick}
          faction={user.faction_id}
          onPosted={(p) => {
            setPosts([p, ...(posts ?? [])]);
            setStats((cur) => (cur ? { ...cur, posts: cur.posts + 1 } : cur));
          }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Посты</h2>
        {posts === null && <FeedSkeleton count={2} />}
        {posts?.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-[16px] font-semibold">Здесь ещё пусто</p>
            <p className="mt-1 text-[13px] text-muted">
              {mine ? "Первый пост за тобой." : "Боец пока молчит."}
            </p>
          </div>
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

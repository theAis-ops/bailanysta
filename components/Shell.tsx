"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { setScope, useScope, type Scope } from "@/lib/feedScope";
import { plural } from "@/lib/format";
import { useSession, useTheme, writeTheme } from "@/lib/session";
import type { Fighter, Post, WarScore } from "@/lib/types";
import {
  IconBell, IconFeed, IconMoon, IconSearch, IconShield,
  IconSun, IconSwords, IconTrophy, IconUser,
} from "./icons";

/** Квадратная плашка фракции — используется как аватар по всему интерфейсу. */
export function FactionTile({ id, size = 24, radius = 3 }: { id?: string; size?: number; radius?: number }) {
  const f = byId(id);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `${f.accent}1f`,
        fontSize: Math.round(size * 0.55),
        lineHeight: 1,
      }}
    >
      {f.emoji}
    </span>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const session = useSession();
  const theme = useTheme();
  const scope = useScope();
  const nick = session?.nick ?? null;

  const [scores, setScores] = useState<WarScore[]>([]);
  const [top, setTop] = useState<Fighter[]>([]);
  const [recent, setRecent] = useState<Post[]>([]);
  const [alerts, setAlerts] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const onboarding = path === "/";

  useEffect(() => {
    let alive = true;
    const pull = () =>
      api.war()
        .then((d) => { if (alive) { setScores(d.scores); setTop(d.top); } })
        .catch(() => {});
    pull();
    const t = setInterval(pull, 20_000);
    return () => { alive = false; clearInterval(t); };
  }, [path]);

  useEffect(() => {
    if (onboarding) return;
    let alive = true;
    api.feed({ limit: 3 }, nick)
      .then((d) => { if (alive) setRecent(d.posts); })
      .catch(() => {});
    return () => { alive = false; };
  }, [onboarding, nick, path]);

  useEffect(() => {
    if (!nick) return;
    let alive = true;
    const poll = () =>
      api.notifications(nick)
        .then((d) => { if (alive) setAlerts(d.notifications.length); })
        .catch(() => {});
    poll();
    const t = setInterval(poll, 25_000);
    return () => { alive = false; clearInterval(t); };
  }, [nick]);

  const faction = byId(session?.faction);
  const total = scores.reduce((s, f) => s + Number(f.score), 0) || 1;
  const ordered = [...scores].sort((a, b) => a.ordinal - b.ordinal);

  const NAV = [
    { href: "/feed/", label: "Лента", Icon: IconFeed, scope: "all" as Scope },
    { href: "/feed/", label: "Моя фракция", Icon: IconShield, scope: "faction" as Scope },
    { href: "/feed/", label: "Территория врага", Icon: IconSwords, scope: "enemy" as Scope },
    { href: "/war/", label: "Табло войны", Icon: IconTrophy },
    ...(nick ? [{ href: `/u/?n=${nick}`, label: "Профиль", Icon: IconUser }] : []),
  ];

  function isActive(item: (typeof NAV)[number]) {
    if (item.scope) return path.startsWith("/feed") && scope === item.scope;
    if (item.href.startsWith("/war")) return path.startsWith("/war");
    return path.startsWith("/u");
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bailanysta:search", { detail: query }));
    }
    if (!path.startsWith("/feed")) router.push("/feed/");
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-card">
        <div className="mx-auto flex h-[58px] max-w-[1180px] items-center gap-5 px-5">
          <Link href={nick ? "/feed/" : "/"} className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[15px] font-bold text-white">
              b
            </span>
            <span className="hidden text-[19px] font-bold tracking-tight sm:inline">bailanysta</span>
          </Link>

          {!onboarding && (
            <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
              {[
                { href: "/feed/", label: "Лента", on: path.startsWith("/feed") },
                { href: "/war/", label: "Война", on: path.startsWith("/war") },
                ...(nick ? [{ href: `/u/?n=${nick}`, label: "Профиль", on: path.startsWith("/u") }] : []),
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.on ? "page" : undefined}
                  className={`relative px-3.5 py-[19px] text-[13px] font-semibold uppercase tracking-wide transition-colors ${
                    item.on ? "text-text" : "text-muted hover:text-text"
                  }`}
                >
                  {item.label}
                  {item.on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-brand" />}
                </Link>
              ))}
            </nav>
          )}

          <div className={`flex items-center gap-1 ${onboarding ? "ml-auto" : ""}`}>
            {!onboarding && (
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Искать по постам"
                aria-expanded={searchOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-text"
              >
                <IconSearch className="h-[18px] w-[18px]" />
              </button>
            )}
            <button
              onClick={() => writeTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-text"
            >
              {theme === "dark" ? <IconSun className="h-[18px] w-[18px]" /> : <IconMoon className="h-[18px] w-[18px]" />}
            </button>

            {nick && (
              <>
                <Link
                  href={`/u/?n=${nick}`}
                  aria-label={`Сводки с фронта: ${alerts}`}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-text"
                >
                  <IconBell className="h-[18px] w-[18px]" />
                  {alerts > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {alerts > 99 ? "99+" : alerts}
                    </span>
                  )}
                </Link>
                <Link href={`/u/?n=${nick}`} className="ml-1.5 flex items-center gap-2">
                  <FactionTile id={session?.faction} size={32} radius={16} />
                  <span className="hidden leading-tight lg:block">
                    <span className="block text-[13px] font-semibold">{nick}</span>
                    <span className="block text-[11px] text-muted">боец фракции «{faction.name}»</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t border-line bg-card">
            <div className="mx-auto flex max-w-[1180px] gap-2 px-5 py-2.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Искать по постам"
                aria-label="Искать по постам"
                className="flex-1 rounded-[3px] border border-line bg-card-2 px-3 py-2 text-[14px] outline-none"
              />
              <button type="submit" className="btn-brand px-5 text-[12px] uppercase">Найти</button>
            </div>
          </form>
        )}

        {/* Полоса контроля территории: ширина сегмента = доля фракции в лайках */}
        {!onboarding && ordered.length > 0 && (
          <div className="flex h-[3px] w-full" aria-hidden>
            {ordered.map((f) => (
              <span
                key={f.id}
                title={`${f.name}: ${f.score}`}
                className="h-full transition-[width] duration-700 ease-out"
                style={{ width: `${(Number(f.score) / total) * 100}%`, background: f.accent }}
              />
            ))}
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-[1180px] gap-7 px-5">
        {!onboarding && (
          <aside className="sticky top-[76px] hidden h-fit w-[178px] shrink-0 py-6 lg:block">
            <nav className="space-y-0.5">
              {NAV.map((item) => {
                const on = isActive(item);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => item.scope && setScope(item.scope)}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[13px] font-medium transition-colors ${
                      on ? "bg-card text-brand" : "text-text hover:bg-card"
                    }`}
                  >
                    <item.Icon className={`h-[18px] w-[18px] ${on ? "text-brand" : "text-muted"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {top.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Лучшие бойцы
                </h2>
                <div className="mt-3 flex items-center">
                  {top.slice(0, 5).map((f, i) => (
                    <Link
                      key={f.nick}
                      href={`/u/?n=${f.nick}`}
                      title={`${f.nick} · ${f.contribution}`}
                      className="rounded-full ring-2 ring-bg transition-transform hover:z-10 hover:scale-110"
                      style={{ marginLeft: i ? -8 : 0 }}
                    >
                      <FactionTile id={f.faction_id} size={30} radius={15} />
                    </Link>
                  ))}
                  {top.length > 5 && (
                    <Link
                      href="/war/"
                      className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white ring-2 ring-bg"
                    >
                      +{top.length - 5}
                    </Link>
                  )}
                </div>
              </section>
            )}

            {recent.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Активность
                </h2>
                <ul className="mt-2">
                  {recent.map((p, i) => (
                    <li
                      key={p.id}
                      className="border-b border-line py-3 last:border-0"
                      style={{ opacity: 1 - i * 0.22 }}
                    >
                      <p className="line-clamp-2 text-[13px] leading-snug">{p.body}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {plural(p.likes, "очко", "очка", "очков")}{" "}
                        <span className="text-brand">
                          {plural(p.comments, "комментарий", "комментария", "комментариев")}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href="/feed/" className="mt-1 inline-block text-[12px] text-brand hover:underline">
                  + Показать всё
                </Link>
              </section>
            )}
          </aside>
        )}

        <main className={`min-w-0 flex-1 py-6 ${onboarding ? "" : "max-w-[644px]"}`}>{children}</main>

        {!onboarding && <div className="hidden w-[178px] shrink-0 lg:block" />}
      </div>

      <footer className="px-5 py-8 text-center text-[12px] leading-relaxed text-muted">
        Тестовое задание для nFactorial Incubator ·{" "}
        <a
          href="https://github.com/theAis-ops/bailanysta"
          className="text-brand hover:underline"
        >
          исходники на GitHub
        </a>
        <br />© 2026 Bailanysta. Минусов здесь нет — только захват территории.
      </footer>
    </div>
  );
}

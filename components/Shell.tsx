"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { useSession, useTheme, writeTheme } from "@/lib/session";
import type { WarScore } from "@/lib/types";
import WarBar from "./WarBar";

const NAV = [
  { href: "/feed", label: "Лента" },
  { href: "/war", label: "Война" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const session = useSession();
  const theme = useTheme();
  const [scores, setScores] = useState<WarScore[]>([]);
  const [alerts, setAlerts] = useState(0);

  const refreshWar = useCallback(() => {
    api.war().then((d) => setScores(d.scores)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshWar();
    const t = setInterval(refreshWar, 20_000);
    return () => clearInterval(t);
  }, [refreshWar, path]);

  const nick = session?.nick ?? null;
  useEffect(() => {
    if (!nick) return;
    const poll = () =>
      api.notifications(nick).then((d) => setAlerts(d.notifications.length)).catch(() => {});
    poll();
    const t = setInterval(poll, 25_000);
    return () => clearInterval(t);
  }, [nick]);

  const faction = byId(session?.faction);
  const onboarding = path === "/";

  function toggleTheme() {
    writeTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href={session ? "/feed" : "/"} className="font-display text-lg font-extrabold tracking-tight">
            Bailanysta
          </Link>

          {!onboarding && (
            <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={path.startsWith(item.href) ? "page" : undefined}
                  className={`notch notch-sm px-3 py-1.5 transition-colors ${
                    path.startsWith(item.href)
                      ? "bg-accent text-black"
                      : "text-muted hover:bg-panel-2 hover:text-text"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {session && (
                <Link
                  href={`/u/?n=${session.nick}`}
                  aria-current={path.startsWith("/u") ? "page" : undefined}
                  className={`notch notch-sm px-3 py-1.5 transition-colors ${
                    path.startsWith("/u") ? "bg-accent text-black" : "text-muted hover:bg-panel-2 hover:text-text"
                  }`}
                >
                  Профиль
                  {alerts > 0 && <span className="ml-1.5 text-accent-text">{alerts}</span>}
                </Link>
              )}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {session && (
              <span className="hidden font-mono text-[11px] uppercase tracking-wider text-muted sm:inline">
                {faction.emoji} {session.nick}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className="notch notch-sm border border-line px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-text"
              aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
            >
              {theme === "dark" ? "☾" : "☀"}
            </button>
          </div>

          {!onboarding && scores.length > 0 && (
            <div className="w-full">
              <WarBar scores={scores} compact />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>

      <footer className="border-t border-line px-4 py-6 text-center font-mono text-[11px] text-muted">
        тестовое задание для nFactorial Incubator ·{" "}
        <a
          href="https://github.com/theAis-ops/bailanysta"
          className="underline decoration-dotted hover:text-accent-text"
        >
          исходники
        </a>
      </footer>
    </div>
  );
}

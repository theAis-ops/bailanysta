"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FactionMark from "@/components/FactionMark";
import { WarSkeleton } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { plural } from "@/lib/format";
import type { Fighter, WarScore } from "@/lib/types";

export default function War() {
  const [scores, setScores] = useState<WarScore[] | null>(null);
  const [top, setTop] = useState<Fighter[]>([]);

  useEffect(() => {
    const load = () =>
      api.war().then((d) => { setScores(d.scores); setTop(d.top); }).catch(() => setScores([]));
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const total = (scores ?? []).reduce((s, f) => s + Number(f.score), 0) || 1;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">табло</p>
        <h1 className="mt-1 font-display text-[clamp(1.5rem,6vw,1.875rem)] font-extrabold">Соғыс</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Территория делится по лайкам: каждый лайк засчитывается фракции автора поста.
          Поэтому лайк врагу — это подарок врагу.
        </p>
      </header>

      {scores === null ? (
        <WarSkeleton />
      ) : (
        <ol className="space-y-3">
          {scores.map((f, i) => {
            const share = (Number(f.score) / total) * 100;
            return (
              <li key={f.id} className="notch panel p-4" style={{ borderLeft: `2px solid ${f.accent}` }}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-xs text-muted">#{i + 1}</span>
                  <span className="text-xl" aria-hidden>{f.emoji}</span>
                  <span className="font-display text-lg font-bold">{f.name}</span>
                  <span className="ml-auto font-mono text-xl font-bold" style={{ color: f.accent }}>
                    {f.score}
                  </span>
                </div>
                <div className="notch notch-sm mt-3 h-2 w-full overflow-hidden bg-panel-2">
                  <div
                    className="h-full transition-[width] duration-700 ease-out"
                    style={{ width: `${share}%`, background: f.accent }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted">
                  {share.toFixed(1)}% территории · {plural(Number(f.posts), "пост", "поста", "постов")} ·{" "}
                  {plural(Number(f.humans), "живой боец", "живых бойца", "живых бойцов")}
                </p>
                <p className="mt-1 text-[13px] italic text-muted">«{f.motto}»</p>
              </li>
            );
          })}
        </ol>
      )}

      {top.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Лучшие бойцы</h2>
          <p className="mt-1 font-mono text-[11px] text-muted">по количеству лайков на своих постах</p>
          <ul className="mt-3 divide-y divide-line border border-line">
            {top.map((f, i) => (
              <li key={f.nick} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="w-6 font-mono text-xs text-muted">{i + 1}</span>
                <Link href={`/u/?n=${f.nick}`} className="font-mono font-semibold hover:underline">
                  @{f.nick}
                </Link>
                <FactionMark id={f.faction_id} />
                <span
                  className="ml-auto font-mono font-bold"
                  style={{ color: byId(f.faction_id).accent }}
                >
                  {f.contribution}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

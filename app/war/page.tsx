"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WarSkeleton } from "@/components/Skeletons";
import { api } from "@/lib/api";
import { byId } from "@/lib/factions";
import { plural } from "@/lib/format";
import type { Fighter, WarScore } from "@/lib/types";

/** Квадратная плашка фракции: эмодзи на подложке её же цвета. */
function FactionTile({
  emoji,
  accent,
  className = "h-8 w-8 text-[17px]",
}: {
  emoji: string;
  accent: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] ${className}`}
      style={{ background: `${accent}1f` }}
    >
      {emoji}
    </span>
  );
}

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
    <div className="space-y-4">
      <header>
        <h1 className="text-[20px] font-semibold text-text">Соғыс</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Территория делится по лайкам: каждый лайк засчитывается фракции автора поста.
          Поэтому лайк врагу — это подарок врагу.
        </p>
      </header>

      {scores === null ? (
        <WarSkeleton />
      ) : (
        <ol className="card divide-y divide-line">
          {scores.map((f, i) => {
            const share = (Number(f.score) / total) * 100;
            return (
              <li key={f.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-[12px] text-muted">#{i + 1}</span>
                  <FactionTile emoji={f.emoji} accent={f.accent} />
                  <span className="text-[15px] font-semibold">{f.name}</span>
                  <span className="ml-auto text-[18px] font-bold" style={{ color: f.accent }}>
                    {f.score}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card-2">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${share}%`, background: f.accent }}
                  />
                </div>

                <p className="mt-2 text-[12px] text-muted">
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
        <section className="card">
          <div className="border-b border-line p-4">
            <h2 className="text-[15px] font-semibold">Лучшие бойцы</h2>
            <p className="mt-0.5 text-[12px] text-muted">по количеству лайков на своих постах</p>
          </div>
          <ul className="divide-y divide-line">
            {top.map((f, i) => {
              const faction = byId(f.faction_id);
              return (
                <li key={f.nick} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-[12px] text-muted">{i + 1}</span>
                  <FactionTile
                    emoji={faction.emoji}
                    accent={faction.accent}
                    className="h-6 w-6 text-[13px]"
                  />
                  <Link
                    href={`/u/?n=${f.nick}`}
                    className="text-[14px] font-medium wrap-anywhere hover:underline"
                  >
                    @{f.nick}
                  </Link>
                  <span className="ml-auto text-[14px] font-bold" style={{ color: faction.accent }}>
                    {f.contribution}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";

import type { WarScore } from "@/lib/types";

/**
 * Полоса контроля территории — главный элемент интерфейса.
 * Ширина сегмента равна доле фракции в общем количестве лайков,
 * поэтому один лайк действительно двигает границу.
 */
export default function WarBar({ scores, compact = false }: { scores: WarScore[]; compact?: boolean }) {
  const total = scores.reduce((s, f) => s + Number(f.score), 0) || 1;
  const ordered = [...scores].sort((a, b) => a.ordinal - b.ordinal);
  const leader = [...scores].sort((a, b) => Number(b.score) - Number(a.score))[0];

  return (
    <div className={compact ? "" : "space-y-2"}>
      <div className="notch notch-sm flex h-2.5 w-full overflow-hidden border border-line bg-panel-2">
        {ordered.map((f) => {
          const share = (Number(f.score) / total) * 100;
          return (
            <div
              key={f.id}
              title={`${f.name}: ${f.score}`}
              className="h-full transition-[width] duration-700 ease-out"
              style={{
                width: `${share}%`,
                background: f.accent,
                boxShadow: f.id === leader?.id ? `0 0 12px ${f.accent}` : undefined,
              }}
            />
          );
        })}
      </div>

      {!compact && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          {ordered.map((f) => (
            <li key={f.id} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2 w-2" style={{ background: f.accent }} />
              <span className="uppercase tracking-wider">{f.name}</span>
              <span style={{ color: f.accent }}>{f.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

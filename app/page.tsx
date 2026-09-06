"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { FACTIONS } from "@/lib/factions";
import { readSession, writeSession } from "@/lib/session";
import type { FactionId } from "@/lib/types";

export default function Onboarding() {
  const router = useRouter();
  const [picked, setPicked] = useState<FactionId | null>(null);
  const [nick, setNick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (readSession()) router.replace("/feed");
  }, [router]);

  // Акцент интерфейса меняется прямо во время выбора — сторона видна до вступления.
  useEffect(() => {
    if (picked) document.documentElement.dataset.faction = picked;
  }, [picked]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!picked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.join(nick, picked);
      writeSession({ nick: user.nick, faction: user.faction_id });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Что-то пошло не так. Попробуй ещё раз.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[680px] space-y-6 py-10">
      <section className="rise">
        <p className="text-[12px] uppercase tracking-[0.14em] text-brand">Соғыс · война фракций</p>
        <h1 className="mt-2 text-[clamp(1.5rem,5vw,2.25rem)] font-bold leading-tight text-text wrap-anywhere">
          Казахстанский&nbsp;IT раскололся на четыре части
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Здесь пишут посты и забирают территорию. Каждый лайк — очко твоей фракции,
          каждый пост — повод для врагов прийти в комментарии. Выбери сторону.
        </p>
      </section>

      <form onSubmit={join} className="space-y-6">
        <fieldset>
          <legend className="sr-only">Выбор фракции</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {FACTIONS.map((f) => {
              const active = picked === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPicked(f.id)}
                  aria-pressed={active}
                  className={`card p-4 text-left transition-all ${active ? "" : "hover:border-muted"}`}
                  // Выбранную сторону подсвечиваем её цветом: рамка, лёгкая заливка, кольцо.
                  style={
                    active
                      ? {
                          borderWidth: 2,
                          borderColor: f.accent,
                          background: `${f.accent}0f`,
                          boxShadow: `0 0 0 3px ${f.accent}1f`,
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[20px]"
                      style={{ background: `${f.accent}1f` }}
                    >
                      {f.emoji}
                    </span>
                    <span className="text-[15px] font-semibold">{f.name}</span>
                    <span className="ml-auto text-[11px] uppercase tracking-wider" style={{ color: f.accent }}>
                      {f.code}
                    </span>
                  </span>
                  <span className="mt-2.5 block text-[13px] italic text-muted">«{f.motto}»</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-muted">{f.blurb}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="card flex flex-wrap items-center gap-3 p-4">
          <label htmlFor="nick" className="text-[12px] text-muted">
            Позывной
          </label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="как тебя звать"
            maxLength={20}
            className="min-w-0 flex-1 rounded-[3px] border border-line bg-card-2 px-3 py-2 text-[14px] outline-none"
          />
          <button
            type="submit"
            disabled={!picked || nick.trim().length < 2 || busy}
            className="btn-brand px-6 py-2 text-[13px] uppercase"
          >
            {busy ? "Вступаем…" : "Вступить"}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
        <p className="text-[12px] text-muted">
          Пароля нет. Позывной хранится только в этом браузере — введи его снова, чтобы вернуться.
        </p>
      </form>
    </div>
  );
}

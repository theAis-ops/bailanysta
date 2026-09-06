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
    <div className="space-y-8">
      <section className="rise">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-text">
          соғыс · война фракций
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.5rem,7vw,3rem)] font-extrabold leading-[1.05] wrap-anywhere">
          Казахстанский&nbsp;IT
          <br />
          раскололся на четыре части
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Здесь пишут посты и забирают территорию. Каждый лайк — очко твоей фракции,
          каждый пост — повод для врагов прийти в комментарии. Выбери сторону.
        </p>
      </section>

      <form onSubmit={join} className="space-y-4">
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
                  className={`notch relative overflow-hidden p-4 text-left transition-all duration-200 ${
                    active ? "scale-[1.01]" : "opacity-75 hover:opacity-100"
                  }`}
                  style={{
                    background: active ? `${f.accent}14` : "var(--panel)",
                    border: `1px solid ${active ? f.accent : "var(--line)"}`,
                  }}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="hatch pointer-events-none absolute inset-0 opacity-40"
                      style={{ ["--accent" as string]: f.accent }}
                    />
                  )}
                  <span className="relative flex items-baseline gap-2">
                    <span className="text-2xl" aria-hidden>{f.emoji}</span>
                    <span className="font-display text-lg font-bold">{f.name}</span>
                    <span
                      className="ml-auto font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: f.accent }}
                    >
                      {f.code}
                    </span>
                  </span>
                  <span className="relative mt-2 block text-sm italic text-muted">«{f.motto}»</span>
                  <span className="relative mt-1.5 block text-[13px] leading-relaxed text-muted">
                    {f.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="notch panel flex flex-wrap items-center gap-3 p-4">
          <label htmlFor="nick" className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Позывной
          </label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="как тебя звать"
            maxLength={20}
            className="notch notch-sm min-w-0 flex-1 bg-panel-2 px-3 py-2 font-mono outline-none"
          />
          <button
            type="submit"
            disabled={!picked || nick.trim().length < 2 || busy}
            className="notch notch-sm bg-accent px-5 py-2 font-mono text-xs uppercase tracking-wider text-black transition-opacity disabled:opacity-30"
          >
            {busy ? "Вступаем…" : "Вступить"}
          </button>
        </div>

        {error && (
          <p role="alert" className="font-mono text-xs text-danger">
            {error}
          </p>
        )}
        <p className="font-mono text-[11px] text-muted">
          Пароля нет. Позывной хранится только в этом браузере — введи его снова, чтобы вернуться.
        </p>
      </form>
    </div>
  );
}

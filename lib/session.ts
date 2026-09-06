"use client";

import { useSyncExternalStore } from "react";
import type { FactionId } from "./types";

/**
 * Личность бойца хранится в браузере: ник плюс фракция.
 * Паролей нет намеренно — см. README, раздел о компромиссах.
 *
 * Читаем через useSyncExternalStore, а не через useEffect: localStorage —
 * это внешнее хранилище, и React умеет подписываться на такие ровно так.
 * Побочный плюс: смена стороны мгновенно доезжает до всех компонентов сразу.
 */
export type Session = { nick: string; faction: FactionId };
export type Theme = "light" | "dark";

const SESSION_KEY = "bailanysta.session";
const THEME_KEY = "bailanysta.theme";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
}

// useSyncExternalStore требует стабильную ссылку: пересобираем объект,
// только когда реально изменилась строка в хранилище.
let cache: { raw: string | null; value: Session | null } = { raw: null, value: null };

function sessionSnapshot(): Session | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  if (raw !== cache.raw) {
    let value: Session | null = null;
    try {
      value = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      value = null;
    }
    cache = { raw, value };
  }
  return cache.value;
}

const noSession = () => null;

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, sessionSnapshot, noSession);
}

function themeSnapshot(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme) ?? "light";
  } catch {
    return "light";
  }
}

const lightTheme = (): Theme => "light";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, themeSnapshot, lightTheme);
}

export function readSession(): Session | null {
  return sessionSnapshot();
}

export function writeSession(s: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch { /* приватный режим — живём без сохранения */ }
  document.documentElement.dataset.faction = s.faction;
  emit();
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* игнорируем */ }
  emit();
}

export function writeTheme(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch { /* игнорируем */ }
  document.documentElement.dataset.theme = t;
  emit();
}

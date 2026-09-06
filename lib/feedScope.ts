"use client";

import { useSyncExternalStore } from "react";

/**
 * Выбранный раздел ленты живёт в маленьком общем сторе: его меняет
 * боковое меню, а читает страница ленты. Через URL не гоняем — статический
 * экспорт потребовал бы Suspense вокруг всего каркаса.
 */
export type Scope = "all" | "faction" | "enemy";

export const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "Весь мир" },
  { id: "faction", label: "Моя фракция" },
  { id: "enemy", label: "Территория врага" },
];

let current: Scope = "all";
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

const snapshot = () => current;

export function setScope(next: Scope) {
  if (next === current) return;
  current = next;
  for (const l of listeners) l();
}

export function useScope(): Scope {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

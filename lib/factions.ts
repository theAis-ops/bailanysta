import type { FactionId } from "./types";

/**
 * Витрина фракций. Названия и девизы дублируют БД сознательно:
 * экран выбора стороны должен нарисоваться мгновенно, до первого запроса.
 */
export const FACTIONS: {
  id: FactionId; name: string; code: string; emoji: string; motto: string; blurb: string; accent: string;
}[] = [
  {
    id: "vibe",
    name: "Вайбкодеры",
    code: "VIBE",
    emoji: "🌀",
    motto: "Работает — не трогай. Не работает — перегенерируй.",
    blurb: "Пишут промтом, читают по диагонали, деплоят в пятницу.",
    accent: "#a855f7",
  },
  {
    id: "junior",
    name: "Джуны",
    code: "JUNIOR",
    emoji: "🌱",
    motto: "Ещё один туториал, и я готов.",
    blurb: "День 47 подготовки. Двести откликов. Бесконечный оптимизм.",
    accent: "#f59e0b",
  },
  {
    id: "legacy",
    name: "Легаси",
    code: "LEGACY",
    emoji: "💾",
    motto: "Мы не умерли. Мы в проде.",
    blurb: "1С, PHP 5.6 и обработка, которая переживёт ваш стартап.",
    accent: "#22c55e",
  },
  {
    id: "furry",
    name: "Фурри",
    code: "FURRY",
    emoji: "🐾",
    motto: "Весь ваш бэкенд держится на нас. Пожалуйста.",
    blurb: "Rust, хоумлаб под столом и лучший аптайм в стране.",
    accent: "#ec4899",
  },
];

export const byId = (id?: string) => FACTIONS.find((f) => f.id === id) ?? FACTIONS[0];

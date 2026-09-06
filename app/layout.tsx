import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest, Unbounded } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

/**
 * Шрифты подбирались с проверкой на казахский алфавит. Unbounded даёт
 * характер заголовкам, но букв ә, ғ, қ, ң, ө, ұ, ү в нём нет — поэтому
 * подстраховываем его Onest, а весь текст, который вводят пользователи,
 * набираем Onest и IBM Plex Mono: они покрывают алфавит целиком.
 */
const display = Unbounded({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "600", "800"],
  variable: "--font-unbounded",
});
const body = Onest({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-onest",
});
const mono = IBM_Plex_Mono({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Bailanysta — соғыс фракций",
  description:
    "Соцсеть казахстанского IT, расколотая на четыре фракции. Выбери сторону, пиши посты, забирай территорию лайками.",
};

/** Тема и фракция ставятся до первой отрисовки, иначе моргает чужой цвет. */
const themeBoot = `
try {
  var s = JSON.parse(localStorage.getItem('bailanysta.session') || 'null');
  document.documentElement.dataset.faction = (s && s.faction) || 'vibe';
  document.documentElement.dataset.theme = localStorage.getItem('bailanysta.theme') || 'dark';
} catch (e) {
  document.documentElement.dataset.faction = 'vibe';
  document.documentElement.dataset.theme = 'dark';
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" data-faction="vibe" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

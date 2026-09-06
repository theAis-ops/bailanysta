import type { Metadata } from "next";
import { Onest } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

/**
 * Один шрифт на весь интерфейс. Onest выбран потому, что покрывает
 * казахский алфавит целиком: ә, ғ, қ, ң, ө, ұ, ү, і.
 */
const onest = Onest({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-onest",
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
  document.documentElement.dataset.theme = localStorage.getItem('bailanysta.theme') || 'light';
} catch (e) {
  document.documentElement.dataset.faction = 'vibe';
  document.documentElement.dataset.theme = 'light';
}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="light" data-faction="vibe" suppressHydrationWarning>
      <body className={onest.variable}>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

const display = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "600", "800"],
  variable: "--font-display",
});
const body = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  variable: "--font-mono",
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

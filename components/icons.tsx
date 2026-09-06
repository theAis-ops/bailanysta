/** Иконки интерфейса. Инлайном, чтобы не тянуть библиотеку ради десяти линий. */
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const IconFeed = (p: P) => (
  <svg {...base} {...p}><path d="M4 6h16M4 12h16M4 18h10" /></svg>
);
export const IconShield = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6l7-3z" /></svg>
);
export const IconSwords = (p: P) => (
  <svg {...base} {...p}><path d="M4 4l9 9M20 4l-9 9M6 20l4-4M18 20l-4-4M3 17l4 4M21 17l-4 4" /></svg>
);
export const IconTrophy = (p: P) => (
  <svg {...base} {...p}><path d="M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M9 20h6M12 14v6" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}><path d="M18 15V10a6 6 0 10-12 0v5l-1.5 3h15L18 15zM10 21h4" /></svg>
);
export const IconSun = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>
);
export const IconMoon = (p: P) => (
  <svg {...base} {...p}><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" /></svg>
);
export const IconComment = (p: P) => (
  <svg {...base} {...p}><path d="M20 12a7 7 0 01-7 7H8l-4 3v-4.6A7 7 0 0111 5h2a7 7 0 017 7z" /></svg>
);
export const IconShare = (p: P) => (
  <svg {...base} {...p}><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 15V3M8 7l4-4 4 4" /></svg>
);
export const IconHeart = (p: P & { filled?: boolean }) => (
  <svg {...base} {...p} fill={p.filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.8C19 15.6 12 20 12 20z" />
  </svg>
);
export const IconDots = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="5" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="12" cy="19" r="1.2" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
);

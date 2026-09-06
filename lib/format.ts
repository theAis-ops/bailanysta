export function timeAgo(iso: string): string {
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 45) return "только что";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} мин`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} ч`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} дн`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Разбивает текст на обычные куски и хэштеги, чтобы отрисовать вторые ссылками. */
export function splitTags(body: string): { text: string; tag?: string }[] {
  const out: { text: string; tag?: string }[] = [];
  const re = /#([\p{L}\p{N}_]{2,30})/gu;
  let last = 0;
  for (const m of body.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: body.slice(last, at) });
    out.push({ text: m[0], tag: m[1].toLowerCase() });
    last = at + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last) });
  return out;
}

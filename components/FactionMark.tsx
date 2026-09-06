import { byId } from "@/lib/factions";
import type { FactionId } from "@/lib/types";

/** Метка фракции: эмодзи, код и цвет. Один компонент на все экраны. */
export default function FactionMark({ id, showName = false }: { id: FactionId; showName?: boolean }) {
  const f = byId(id);
  return (
    <span
      className="notch notch-sm inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ background: `${f.accent}1f`, color: f.accent }}
    >
      <span aria-hidden>{f.emoji}</span>
      {showName ? f.name : f.code}
    </span>
  );
}

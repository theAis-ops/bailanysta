import { describe, expect, it } from "vitest";
import {
  extractHashtags,
  PERSONAS,
  planBotReplies,
} from "../supabase/functions/api/personas";

describe("extractHashtags", () => {
  it("вытаскивает метки и приводит их к нижнему регистру", () => {
    expect(extractHashtags("привет #Rust и #ДЕДЛАЙН")).toEqual(["rust", "дедлайн"]);
  });

  it("понимает казахские буквы", () => {
    expect(extractHashtags("#соғыс басталды")).toEqual(["соғыс"]);
  });

  it("не повторяет одну метку дважды", () => {
    expect(extractHashtags("#джун и снова #джун")).toEqual(["джун"]);
  });

  it("игнорирует решётку без слова и односимвольные метки", () => {
    expect(extractHashtags("# и #a просто текст")).toEqual([]);
  });

  it("берёт не больше восьми меток", () => {
    const many = Array.from({ length: 12 }, (_, i) => `#тег${i}`).join(" ");
    expect(extractHashtags(many)).toHaveLength(8);
  });
});

describe("planBotReplies", () => {
  const plan = (body: string, faction = "vibe", seed = 42) =>
    planBotReplies(body, faction, seed);

  it("зовёт от двух до четырёх ботов", () => {
    for (let seed = 0; seed < 30; seed++) {
      const replies = planBotReplies("обычный пост", "vibe", seed);
      expect(replies.length).toBeGreaterThanOrEqual(2);
      expect(replies.length).toBeLessThanOrEqual(4);
    }
  });

  it("не приводит одного бота дважды", () => {
    const nicks = plan("обычный пост").map((r) => r.nick);
    expect(new Set(nicks).size).toBe(nicks.length);
  });

  it("выстраивает ответы по возрастанию задержки", () => {
    const delays = plan("обычный пост").map((r) => r.delaySec);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
  });

  it("держит задержку внутри характера персонажа", () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const reply of planBotReplies("пост про rust", "legacy", seed)) {
        const persona = PERSONAS.find((p) => p.nick === reply.nick)!;
        const [lo, hi] = persona.delay;
        expect(reply.delaySec).toBeGreaterThanOrEqual(lo);
        expect(reply.delaySec).toBeLessThan(hi);
      }
    }
  });

  it("на пост про nfactorial отвечает тематическими репликами, а не общими", () => {
    for (const reply of plan("делаю тестовое для nfactorial")) {
      const persona = PERSONAS.find((p) => p.nick === reply.nick)!;
      expect(persona.topics.nfactorial).toContain(reply.body);
    }
  });

  it("подхватывает тему поста, когда она узнаётся", () => {
    const replies = planBotReplies("переписал всё на rust", "junior", 7);
    const topical = replies.filter((r) => {
      const persona = PERSONAS.find((p) => p.nick === r.nick)!;
      return persona.topics.rust?.includes(r.body);
    });
    expect(topical.length).toBeGreaterThan(0);
  });

  it("детерминирован: одинаковый seed даёт одинаковый разговор", () => {
    expect(plan("пост", "vibe", 123)).toEqual(plan("пост", "vibe", 123));
  });

  it("разные посты получают разные ответы", () => {
    const a = JSON.stringify(planBotReplies("пост про react", "vibe", 5));
    const b = JSON.stringify(planBotReplies("пост про 1с и delphi", "vibe", 5));
    expect(a).not.toEqual(b);
  });

  it("за сотню постов слово получает каждый из восьми ботов", () => {
    // Регрессия: пока веса перемешивались сдвигом seed, половина персонажей
    // не появлялась в комментариях вообще — лента выглядела беднее, чем есть.
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      for (const r of planBotReplies("нейтральный текст", "vibe", seed)) seen.add(r.nick);
    }
    expect(seen.size).toBe(PERSONAS.length);
  });

  it("своим говорит одно, чужим другое", () => {
    // Союзники попадают в подборку реже врагов — вес у них ниже, — поэтому
    // ищем первый seed, на котором до комментариев дошёл кто-то из своих.
    let checked = 0;
    for (let seed = 0; seed < 60 && checked === 0; seed++) {
      const ally = planBotReplies("нейтральный текст", "furry", seed).find(
        (r) => PERSONAS.find((p) => p.nick === r.nick)!.faction === "furry",
      );
      if (!ally) continue;

      const persona = PERSONAS.find((p) => p.nick === ally.nick)!;
      expect(persona.ally).toContain(ally.body);

      const sameBotAsEnemy = planBotReplies("нейтральный текст", "vibe", seed).find(
        (r) => r.nick === ally.nick,
      );
      if (sameBotAsEnemy) expect(persona.enemy).toContain(sameBotAsEnemy.body);
      checked++;
    }
    expect(checked).toBe(1);
  });
});

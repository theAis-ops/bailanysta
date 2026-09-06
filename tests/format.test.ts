import { describe, expect, it } from "vitest";
import { splitTags, timeAgo } from "../lib/format";

const agoBy = (ms: number) => new Date(Date.now() - ms).toISOString();

describe("timeAgo", () => {
  it("свежее время называет «только что»", () => {
    expect(timeAgo(agoBy(5_000))).toBe("только что");
  });

  it("считает минуты", () => {
    expect(timeAgo(agoBy(7 * 60_000))).toBe("7 мин");
  });

  it("считает часы", () => {
    expect(timeAgo(agoBy(3 * 3_600_000))).toBe("3 ч");
  });

  it("считает дни", () => {
    expect(timeAgo(agoBy(4 * 86_400_000))).toBe("4 дн");
  });
});

describe("splitTags", () => {
  it("отделяет метку от текста", () => {
    expect(splitTags("привет #rust мир")).toEqual([
      { text: "привет " },
      { text: "#rust", tag: "rust" },
      { text: " мир" },
    ]);
  });

  it("склеенные куски дают исходную строку", () => {
    const source = "пост #один и #два в конце #три";
    expect(splitTags(source).map((c) => c.text).join("")).toBe(source);
  });

  it("текст без меток остаётся одним куском", () => {
    expect(splitTags("совсем обычный текст")).toEqual([{ text: "совсем обычный текст" }]);
  });
});

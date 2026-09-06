import { describe, expect, it } from "vitest";
import { plural, splitTags, timeAgo } from "../lib/format";

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

describe("plural", () => {
  it("ставит единственное число после единицы", () => {
    expect(plural(1, "пост", "поста", "постов")).toBe("1 пост");
    expect(plural(21, "пост", "поста", "постов")).toBe("21 пост");
  });

  it("ставит родительный единственного после двух-четырёх", () => {
    expect(plural(3, "пост", "поста", "постов")).toBe("3 поста");
    expect(plural(104, "пост", "поста", "постов")).toBe("104 поста");
  });

  it("ставит множественное после пяти и в подростковом диапазоне", () => {
    expect(plural(5, "пост", "поста", "постов")).toBe("5 постов");
    expect(plural(11, "пост", "поста", "постов")).toBe("11 постов");
    expect(plural(14, "пост", "поста", "постов")).toBe("14 постов");
    expect(plural(112, "пост", "поста", "постов")).toBe("112 постов");
  });

  it("ноль — множественное", () => {
    expect(plural(0, "боец", "бойца", "бойцов")).toBe("0 бойцов");
  });
});

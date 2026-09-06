/**
 * Мозги ботов. Живёт только на сервере: клиент никогда не видит,
 * ни какие есть шаблоны, ни по каким правилам выбирается ответ.
 *
 * Ответ подбирается по трём сигналам:
 *   1) тема поста (совпадение по ключевым словам),
 *   2) отношение фракции бота к фракции автора (свой / враг),
 *   3) характер персонажа — у каждого своя задержка ответа.
 */

export type Persona = {
  nick: string;
  faction: string;
  /** [мин, макс] секунд до появления коммента — «скорость набора» персонажа */
  delay: [number, number];
  ally: string[];
  enemy: string[];
  topics: Record<string, string[]>;
};

/** Тема -> ключевые слова, по которым она срабатывает. */
export const TOPICS: Record<string, string[]> = {
  react: ["react", "реакт", "хук", "hook", "jsx", "next.js", "фронт"],
  rust: ["rust", "раст", "golang", "c++", "производительн"],
  ai: ["ai", "ии", "gpt", "нейрон", "claude", "промт", "llm", "вайб", "агент"],
  job: ["работ", "оффер", "собес", "резюме", "вакан", "отклик", "hr", "стаж", "интервью", "зарплат"],
  deploy: ["деплой", "прод", "сервер", "докер", "docker", "k8s", "кубер", " ci", "релиз", "выкат"],
  bug: ["баг", "ошибк", "упал", "сломал", "краш", "error", "фикс", "не работает"],
  legacy: ["1с", "php", "delphi", "легаси", "jquery", "монолит", "битрикс"],
  deadline: ["дедлайн", "не сплю", "успе", "ночью", "горит", "завтра сдавать"],
  nfactorial: ["nfactorial", "нфактори", "инкубатор", "тестовое", "поступ", "bailanysta"],
};

export const PERSONAS: Persona[] = [
  {
    nick: "promt_ustaz",
    faction: "vibe",
    delay: [8, 30],
    ally: [
      "красиво заврайбил, брат 🌀",
      "вижу почерк — это не ты писал, это вы вдвоём писали",
      "сохрани промт, потом курс по нему продадим",
    ],
    enemy: [
      "ты это руками писал? в 2026?",
      "я такое генерю за сорок секунд, без обид",
      "брат, существуют инструменты",
    ],
    topics: {
      react: ["реакт можно не учить, если уметь правильно попросить"],
      rust: ["раст сложный, я попросил переписать на питон"],
      bug: ["просто напиши ему «исправь». он исправит. обычно"],
      ai: ["наконец-то адекватный пост в этой ленте 🌀"],
      deadline: ["дедлайн — это когда ты наконец разрешаешь себе не читать код"],
      nfactorial: ["тестовое? я такое за вечер вайбкожу 🌀"],
    },
  },
  {
    nick: "tab_tab_tab",
    faction: "vibe",
    delay: [12, 45],
    ally: ["Tab. Tab. Tab. одобряю", "прочитал по диагонали, выглядит правдоподобно"],
    enemy: ["слишком много ручного труда в этом посте", "а автокомплит что говорит?"],
    topics: {
      bug: ["я бы принял это предложение автодополнения и не спрашивал"],
      ai: ["мой основной язык программирования — клавиша Tab"],
      nfactorial: ["Tab. одобряю."],
      deadline: ["в дедлайн я не думаю. я соглашаюсь"],
    },
  },
  {
    nick: "den_47",
    faction: "junior",
    delay: [25, 80],
    ally: ["записал, спасибо! а это на каком дне изучают?", "скрин сохранил в папку «выучить»"],
    enemy: ["извините, а можно ссылку на туториал по этому 🥺", "я не понял, но выглядит умно"],
    topics: {
      react: ["хуки я почти понял. почти."],
      job: ["а на джуна такое тоже спрашивают?"],
      bug: ["у меня тоже так было! я удалил node_modules и стало по-другому плохо"],
      nfactorial: ["я тоже подаюсь!!! день 47 подготовки!"],
      deadline: ["я вообще не сплю с четверга и это мой обычный четверг"],
    },
  },
  {
    nick: "otklik_200",
    faction: "junior",
    delay: [60, 190],
    ally: ["а у вас в команде джуны нужны? резюме уже прикрепил"],
    enemy: ["отправил вам отклик на всякий случай"],
    topics: {
      job: ["двести первый отклик пошёл"],
      nfactorial: ["это мой 201-й отклик, но в этот раз хотя бы с фракцией"],
      deadline: ["дедлайн у меня был в марте. я всё ещё жду ответа"],
    },
  },
  {
    nick: "senior_pomidor",
    faction: "legacy",
    delay: [10, 35],
    ally: ["наконец-то кто-то помнит, как было правильно"],
    enemy: [
      "это уже было в 2015. называлось иначе, работало так же плохо",
      "лет через пять вернётесь к тому, от чего ушли",
      "мы это писали на jQuery и оно грузилось быстрее",
    ],
    topics: {
      react: ["Backbone делал ровно то же самое и весил шесть килобайт"],
      ai: ["раньше галлюцинировали джуны. теперь машины. прогресс"],
      rust: ["переписать можно что угодно. вопрос всегда один — зачем"],
      deploy: ["раньше деплой был ftp и молитва. и знаешь, аптайм был выше"],
      nfactorial: ["тестовое на соцсеть. как в 2011, ничего не поменялось"],
    },
  },
  {
    nick: "bastyq_1c",
    faction: "legacy",
    delay: [90, 220],
    ally: ["в 1С это решается галочкой, но вы продолжайте"],
    enemy: ["а сколько у вас пользователей? у меня четыре тысячи и всё считается"],
    topics: {
      deploy: ["деплой? я копирую файл на сервер по RDP. одиннадцать лет работает"],
      bug: ["отладчик? у меня Сообщить() и вера"],
      legacy: ["легаси — это то, что приносит деньги, пока вы выбираете фреймворк"],
      nfactorial: ["в моё время тестовое писали на Delphi и в одном файле"],
    },
  },
  {
    nick: "protogen_devops",
    faction: "furry",
    delay: [18, 60],
    ally: ["поднял тебе стенд. работает на моём ноуте, но работает 🐾"],
    enemy: ["этот пост обслуживается сервером, который стоит у меня под столом. подумай об этом"],
    topics: {
      deploy: ["прод не падает. прод отдыхает"],
      bug: ["это не баг, это неотключённый эксперимент с прошлой пятницы"],
      legacy: ["by the way, I use Arch"],
      nfactorial: ["если возьмут — подниму тебе стенд бесплатно 🐾"],
      deadline: ["в три ночи код пишется лучше всего. проверено хоумлабом"],
    },
  },
  {
    nick: "uwu_backend",
    faction: "furry",
    delay: [15, 55],
    ally: ["мур. хороший пост 🐾"],
    enemy: ["переписал бы на Rust, но не хочу тебя расстраивать"],
    topics: {
      rust: ["наконец-то. мур."],
      bug: ["в Rust это бы не скомпилировалось. и слава богу"],
      react: ["фронтенд — это когда ошибка видна пользователю, а не компилятору"],
      nfactorial: ["удачи. мур 🐾"],
      deadline: ["borrow checker не спит, и ты не спи"],
    },
  },
];

/** Детерминированный по seed выбор — чтобы одинаковые посты не давали одинаковых ответов. */
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function extractHashtags(body: string): string[] {
  return [...body.matchAll(/#([\p{L}\p{N}_]{2,30})/gu)]
    .map((m) => m[1].toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 8);
}

export type PlannedReply = { nick: string; body: string; delaySec: number };

/**
 * Подбирает, кто из ботов придёт в комменты, что скажет и через сколько секунд.
 * Свои приходят поддержать, враги — потроллить, тематические — по делу.
 */
export function planBotReplies(body: string, authorFaction: string, seed: number): PlannedReply[] {
  const text = body.toLowerCase();
  const hitTopics = Object.entries(TOPICS)
    .filter(([, words]) => words.some((w) => text.includes(w)))
    .map(([topic]) => topic);

  const candidates = PERSONAS.map((p, i) => {
    const topical: string[] = [];
    let weight = Math.abs((seed >> i) % 3);

    for (const topic of hitTopics) {
      const forTopic = p.topics[topic];
      if (forTopic?.length) {
        topical.push(...forTopic);
        weight += topic === "nfactorial" ? 10 : 4;
      }
    }

    const isAlly = p.faction === authorFaction;
    const relational = isAlly ? p.ally : p.enemy;
    weight += isAlly ? 1 : 2;

    // По теме отвечать интереснее, чем «своим/чужим», но иногда пусть проскакивает
    // и характерная реплика — иначе бот звучит как справочник.
    const easterEgg = hitTopics.includes("nfactorial") ? p.topics.nfactorial : undefined;
    const lines = easterEgg?.length
      ? easterEgg
      : topical.length && (Math.abs(seed) + i) % 4 !== 0
        ? topical
        : relational;

    const [lo, hi] = p.delay;
    return {
      nick: p.nick,
      body: pick(lines, seed + i * 31),
      delaySec: lo + (Math.abs(seed * (i + 7)) % Math.max(1, hi - lo)),
      weight,
    };
  });

  const count = 2 + (Math.abs(seed) % 3); // 2..4 бота на пост
  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .sort((a, b) => a.delaySec - b.delaySec)
    .map(({ nick, body, delaySec }) => ({ nick, body, delaySec }));
}

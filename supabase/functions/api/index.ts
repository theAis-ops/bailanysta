/**
 * Bailanysta API — единственная точка входа в данные.
 *
 * Почему всё здесь, а не в браузере:
 *  - база закрыта RLS и доступна только по service-role ключу, который живёт
 *    в окружении функции и никогда не покидает сервер;
 *  - логика ботов, начисление очков войны и расчёт рангов — правила игры,
 *    и клиенту нельзя давать возможность их подкрутить.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { extractHashtags, planBotReplies } from "./personas.ts";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-bailanysta-nick",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" },
  });

const fail = (message: string, status = 400) => json({ error: message }, status);

const AUTHOR = "author:users!posts_author_id_fkey ( nick, faction_id, is_bot, bio )";
const AUTHOR_INNER = "author:users!posts_author_id_fkey!inner ( nick, faction_id, is_bot, bio )";
const RANKS: [number, string][] = [[50, "Аңыз"], [20, "Батыр"], [5, "Жауынгер"], [0, "Рекрут"]];
const rankFor = (score: number) => RANKS.find(([min]) => score >= min)![1];

/** Ник берём из заголовка: паролей в этом продукте нет by design. */
async function currentUser(req: Request) {
  const nick = req.headers.get("x-bailanysta-nick");
  if (!nick) return null;
  const { data } = await db.from("users").select("*").eq("nick", nick).maybeSingle();
  return data;
}

type Row = Record<string, unknown>;

/** Превращает сырые строки из БД в то, что рисует лента. */
function shapePosts(rows: Row[], meId: string | null) {
  const now = Date.now();
  return rows.map((p) => {
    const likes = (p.likes ?? []) as { user_id: string }[];
    const comments = (p.comments ?? []) as { visible_at: string; author: { nick: string } }[];
    const visible = comments.filter((c) => new Date(c.visible_at).getTime() <= now);
    // Кто «сейчас печатает» — комментарий уже сгенерирован, но ещё не всплыл.
    const typing = comments
      .filter((c) => {
        const at = new Date(c.visible_at).getTime();
        return at > now && at - now < 60_000;
      })
      .map((c) => c.author?.nick)
      .filter(Boolean);

    return {
      id: p.id,
      body: p.body,
      hashtags: p.hashtags,
      createdAt: p.created_at,
      editedAt: p.edited_at,
      author: p.author,
      likes: likes.length,
      likedByMe: meId ? likes.some((l) => l.user_id === meId) : false,
      comments: visible.length,
      typing: [...new Set(typing)],
    };
  });
}

/** Боты решают, кто придёт в комменты, и приходят с задержкой «набора текста». */
async function summonBots(postId: string, body: string, authorId: string, authorFaction: string) {
  const seed = [...postId].reduce((a, c) => a + c.charCodeAt(0), body.length);
  const plan = planBotReplies(body, authorFaction, seed);
  if (!plan.length) return;

  const { data: bots } = await db
    .from("users")
    .select("id, nick")
    .in("nick", plan.map((p) => p.nick));
  const byNick = new Map((bots ?? []).map((b) => [b.nick, b.id]));

  const now = Date.now();
  const comments = plan
    .filter((p) => byNick.has(p.nick))
    .map((p) => ({
      post_id: postId,
      author_id: byNick.get(p.nick)!,
      body: p.body,
      visible_at: new Date(now + p.delaySec * 1000).toISOString(),
    }));
  if (comments.length) await db.from("comments").insert(comments);

  // Первый откликнувшийся бот заодно ставит лайк — чтобы пост не висел с нулём.
  const firstBot = comments[0];
  if (firstBot) {
    await db.from("likes").insert({ post_id: postId, user_id: firstBot.author_id }).select();
  }

  await db.from("notifications").insert(
    comments.map((c) => ({
      user_id: authorId,
      kind: "comment",
      payload: { postId, from: plan.find((p) => byNick.get(p.nick) === c.author_id)?.nick },
      visible_at: c.visible_at,
    })),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const seg = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "").split("/").filter(Boolean);
  const q = url.searchParams;
  const me = await currentUser(req);

  try {
    // --- Справочник фракций -------------------------------------------------
    if (req.method === "GET" && seg[0] === "factions") {
      const { data } = await db.from("factions").select("*").order("ordinal");
      return json({ factions: data });
    }

    // --- Вступление во фракцию (оно же «вход») ------------------------------
    if (req.method === "POST" && seg[0] === "session") {
      const { nick, factionId } = await req.json();
      const clean = String(nick ?? "").trim().toLowerCase().replace(/[^a-z0-9_а-яё]/gi, "").slice(0, 20);
      if (clean.length < 2) return fail("Ник должен быть от 2 символов");

      const { data: existing } = await db.from("users").select("*").eq("nick", clean).maybeSingle();
      if (existing) {
        if (existing.is_bot) return fail("Этот ник занят ботом. Придумай свой.", 409);
        return json({ user: existing, returning: true });
      }
      const { data, error } = await db
        .from("users")
        .insert({ nick: clean, faction_id: factionId })
        .select()
        .single();
      if (error) return fail(error.message);
      return json({ user: data, returning: false });
    }

    // --- Лента --------------------------------------------------------------
    if (req.method === "GET" && seg[0] === "feed") {
      const scope = q.get("scope") ?? "all";
      const limit = Math.min(Number(q.get("limit") ?? 15), 40);

      let sel = db
        .from("posts")
        .select(
          `id, body, hashtags, created_at, edited_at,
           ${AUTHOR_INNER},
           likes ( user_id ),
           comments ( visible_at, author:users!comments_author_id_fkey ( nick ) )`,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (me && scope === "faction") sel = sel.eq("author.faction_id", me.faction_id);
      if (me && scope === "enemy") sel = sel.neq("author.faction_id", me.faction_id);
      const tag = q.get("tag");
      if (tag) sel = sel.contains("hashtags", [tag.toLowerCase()]);
      const search = q.get("q");
      if (search) sel = sel.ilike("body", `%${search}%`);
      const cursor = q.get("cursor");
      if (cursor) sel = sel.lt("created_at", cursor);

      const { data, error } = await sel;
      if (error) return fail(error.message, 500);
      const posts = shapePosts(data as Row[], me?.id ?? null);
      return json({ posts, nextCursor: posts.length === limit ? posts.at(-1)!.createdAt : null });
    }

    // --- Публикация ---------------------------------------------------------
    if (req.method === "POST" && seg[0] === "posts" && seg.length === 1) {
      if (!me) return fail("Сначала выбери фракцию", 401);
      const { body } = await req.json();
      const text = String(body ?? "").trim();
      if (!text) return fail("Пустой пост");
      if (text.length > 500) return fail("Максимум 500 символов");

      const { data, error } = await db
        .from("posts")
        .insert({ author_id: me.id, body: text, hashtags: extractHashtags(text) })
        .select(`id, body, hashtags, created_at, edited_at, ${AUTHOR}`)
        .single();
      if (error) return fail(error.message, 500);

      await summonBots(data.id, text, me.id, me.faction_id);
      return json({ post: { ...data, likes: 0, likedByMe: false, comments: 0, typing: [] } }, 201);
    }

    // --- Один пост со всеми комментами --------------------------------------
    if (req.method === "GET" && seg[0] === "posts" && seg[1]) {
      const { data: post } = await db
        .from("posts")
        .select(`id, body, hashtags, created_at, edited_at, ${AUTHOR}, likes ( user_id )`)
        .eq("id", seg[1])
        .maybeSingle();
      if (!post) return fail("Пост не найден", 404);

      const { data: comments } = await db
        .from("comments")
        .select(`id, body, created_at, visible_at, author:users!comments_author_id_fkey ( nick, faction_id, is_bot )`)
        .eq("post_id", seg[1])
        .lte("visible_at", new Date().toISOString())
        .order("visible_at");

      const likes = (post.likes ?? []) as { user_id: string }[];
      return json({
        post: {
          ...post,
          likes: likes.length,
          likedByMe: me ? likes.some((l) => l.user_id === me.id) : false,
        },
        comments,
      });
    }

    // --- Редактирование и удаление своего поста -----------------------------
    if ((req.method === "PATCH" || req.method === "DELETE") && seg[0] === "posts" && seg[1] && seg.length === 2) {
      if (!me) return fail("Нужно войти", 401);
      const { data: post } = await db.from("posts").select("author_id").eq("id", seg[1]).maybeSingle();
      if (!post) return fail("Пост не найден", 404);
      if (post.author_id !== me.id) return fail("Это чужой пост", 403);

      if (req.method === "DELETE") {
        await db.from("posts").delete().eq("id", seg[1]);
        return json({ ok: true });
      }
      const { body } = await req.json();
      const text = String(body ?? "").trim();
      if (!text || text.length > 500) return fail("От 1 до 500 символов");
      const { data } = await db
        .from("posts")
        .update({ body: text, hashtags: extractHashtags(text), edited_at: new Date().toISOString() })
        .eq("id", seg[1])
        .select(`id, body, hashtags, created_at, edited_at, ${AUTHOR}`)
        .single();
      return json({ post: data });
    }

    // --- Лайк = удар по войне -----------------------------------------------
    if (req.method === "POST" && seg[0] === "posts" && seg[1] && seg[2] === "like") {
      if (!me) return fail("Нужно войти", 401);
      const { data: existing } = await db
        .from("likes")
        .select("post_id")
        .eq("post_id", seg[1])
        .eq("user_id", me.id)
        .maybeSingle();

      if (existing) {
        await db.from("likes").delete().eq("post_id", seg[1]).eq("user_id", me.id);
        return json({ liked: false });
      }
      const { error } = await db.from("likes").insert({ post_id: seg[1], user_id: me.id });
      if (error) return fail(error.message, 500);

      const { data: post } = await db
        .from("posts")
        .select("author_id, users!posts_author_id_fkey ( faction_id )")
        .eq("id", seg[1])
        .maybeSingle();
      if (post && post.author_id !== me.id) {
        await db.from("notifications").insert({
          user_id: post.author_id,
          kind: "like",
          payload: { postId: seg[1], from: me.nick, faction: me.faction_id },
        });
      }
      const enemy = (post?.users as { faction_id: string } | null)?.faction_id !== me.faction_id;
      return json({ liked: true, betrayal: enemy });
    }

    // --- Живой комментарий --------------------------------------------------
    if (req.method === "POST" && seg[0] === "posts" && seg[1] && seg[2] === "comments") {
      if (!me) return fail("Нужно войти", 401);
      const { body } = await req.json();
      const text = String(body ?? "").trim().slice(0, 300);
      if (!text) return fail("Пустой комментарий");
      const { data, error } = await db
        .from("comments")
        .insert({ post_id: seg[1], author_id: me.id, body: text })
        .select(`id, body, created_at, visible_at, author:users!comments_author_id_fkey ( nick, faction_id, is_bot )`)
        .single();
      if (error) return fail(error.message, 500);
      return json({ comment: data }, 201);
    }

    // --- Профиль ------------------------------------------------------------
    if (req.method === "GET" && seg[0] === "users" && seg[1]) {
      const { data: user } = await db
        .from("users")
        .select("id, nick, faction_id, bio, is_bot, created_at")
        .eq("nick", seg[1].toLowerCase())
        .maybeSingle();
      if (!user) return fail("Боец не найден", 404);

      const { data: posts, error: postsError } = await db
        .from("posts")
        .select(
          `id, body, hashtags, created_at, edited_at,
           ${AUTHOR_INNER},
           likes ( user_id ),
           comments ( visible_at, author:users!comments_author_id_fkey ( nick ) )`,
        )
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (postsError) return fail(postsError.message, 500);

      const shaped = shapePosts((posts ?? []) as Row[], me?.id ?? null);
      const contribution = shaped.reduce((sum, p) => sum + p.likes, 0);

      // Предательство: лайки, подаренные чужой фракции.
      const { data: given } = await db
        .from("likes")
        .select("posts!inner ( users!posts_author_id_fkey!inner ( faction_id ) )")
        .eq("user_id", user.id);
      const betrayals = (given ?? []).filter(
        (g: Row) => ((g.posts as Row)?.users as Row)?.faction_id !== user.faction_id,
      ).length;

      return json({
        user,
        posts: shaped,
        stats: { posts: shaped.length, contribution, betrayals, rank: rankFor(contribution) },
      });
    }

    // --- Табло войны --------------------------------------------------------
    if (req.method === "GET" && seg[0] === "war") {
      const { data: scores } = await db.from("war_scores").select("*").order("score", { ascending: false });
      const { data: top } = await db.rpc("top_fighters");
      return json({ scores, top: top ?? [] });
    }

    // --- Военные сводки -----------------------------------------------------
    if (req.method === "GET" && seg[0] === "notifications") {
      if (!me) return json({ notifications: [] });
      const { data } = await db
        .from("notifications")
        .select("id, kind, payload, read, created_at")
        .eq("user_id", me.id)
        .lte("visible_at", new Date().toISOString())
        .order("visible_at", { ascending: false })
        .limit(30);
      return json({ notifications: data ?? [] });
    }

    return fail("Нет такого маршрута: " + url.pathname, 404);
  } catch (e) {
    return fail((e as Error).message, 500);
  }
});

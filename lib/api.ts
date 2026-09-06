import type { Comment, Faction, Fighter, Notification, Post, Stats, User, WarScore } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

export class ApiError extends Error {}

/**
 * Единственный способ, которым фронтенд разговаривает с данными.
 * Ник уходит заголовком — сервер по нему находит бойца.
 */
async function call<T>(path: string, init: RequestInit & { nick?: string | null } = {}): Promise<T> {
  const { nick, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${KEY}`,
        apikey: KEY,
        // Заголовки HTTP умеют только latin-1, а ники у нас кириллические
        // и казахские — поэтому кодируем, сервер декодирует обратно.
        ...(nick ? { "x-bailanysta-nick": encodeURIComponent(nick) } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError("Не дозвонились до сервера. Проверь соединение и повтори.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Сервер ответил ${res.status}`);
  return data as T;
}

export type FeedQuery = { scope?: string; tag?: string; q?: string; cursor?: string; limit?: number };

export const api = {
  factions: () => call<{ factions: Faction[] }>("/factions"),

  join: (nick: string, factionId: string) =>
    call<{ user: User; returning: boolean }>("/session", {
      method: "POST",
      body: JSON.stringify({ nick, factionId }),
    }),

  feed: (query: FeedQuery, nick?: string | null) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) p.set(k, String(v));
    return call<{ posts: Post[]; nextCursor: string | null }>(`/feed?${p}`, { nick });
  },

  createPost: (body: string, nick: string) =>
    call<{ post: Post }>("/posts", { method: "POST", body: JSON.stringify({ body }), nick }),

  editPost: (id: string, body: string, nick: string) =>
    call<{ post: Post }>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify({ body }), nick }),

  deletePost: (id: string, nick: string) =>
    call<{ ok: true }>(`/posts/${id}`, { method: "DELETE", nick }),

  toggleLike: (id: string, nick: string) =>
    call<{ liked: boolean; betrayal?: boolean }>(`/posts/${id}/like`, { method: "POST", nick }),

  post: (id: string, nick?: string | null) =>
    call<{ post: Post & { likes: number }; comments: Comment[] }>(`/posts/${id}`, { nick }),

  comment: (id: string, body: string, nick: string) =>
    call<{ comment: Comment }>(`/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ body }), nick }),

  profile: (target: string, nick?: string | null) =>
    call<{ user: User; posts: Post[]; stats: Stats }>(`/users/${encodeURIComponent(target)}`, { nick }),

  war: () => call<{ scores: WarScore[]; top: Fighter[] }>("/war"),

  notifications: (nick: string) => call<{ notifications: Notification[] }>("/notifications", { nick }),
};

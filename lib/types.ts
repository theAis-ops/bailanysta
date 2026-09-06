export type FactionId = "vibe" | "junior" | "legacy" | "furry";

export type Faction = {
  id: FactionId;
  name: string;
  motto: string;
  emoji: string;
  accent: string;
  ordinal: number;
};

export type Author = {
  nick: string;
  faction_id: FactionId;
  is_bot: boolean;
  bio: string;
};

export type Post = {
  id: string;
  body: string;
  hashtags: string[];
  createdAt: string;
  created_at?: string;
  editedAt: string | null;
  author: Author;
  likes: number;
  likedByMe: boolean;
  comments: number;
  /** Боты, чей комментарий уже сгенерирован, но ещё не всплыл */
  typing: string[];
};

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  visible_at: string;
  author: Author;
};

export type WarScore = Faction & { humans: number; posts: number; score: number };
export type Fighter = { nick: string; faction_id: FactionId; is_bot: boolean; contribution: number };
export type Stats = { posts: number; contribution: number; betrayals: number; rank: string };
export type User = { id: string; nick: string; faction_id: FactionId; bio: string; is_bot: boolean; created_at: string };
export type Notification = { id: string; kind: string; payload: Record<string, string>; read: boolean; created_at: string };

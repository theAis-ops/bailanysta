/** Заглушка поста: слева тело, справа узкая колонка голосов — как в настоящей карточке. */
export function PostSkeleton() {
  return (
    <article className="card flex">
      <div className="min-w-0 flex-1 p-3.5">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-5" />
          <div className="skeleton h-3 w-28" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-3/5" />
        </div>
        <div className="skeleton mt-3.5 h-3 w-24" />
      </div>
      <div className="flex w-[52px] shrink-0 items-center justify-center border-l border-line">
        <div className="skeleton h-3 w-6" />
      </div>
    </article>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Лента загружается">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

/** Заглушка таблицы войны: четыре строки одной высоты, разделённые линиями. */
export function WarSkeleton() {
  return (
    <div className="card divide-y divide-line" aria-busy="true" aria-label="Счёт загружается">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex h-[72px] items-center gap-3 px-4">
          <div className="skeleton h-8 w-8" />
          <div className="skeleton h-3 w-32" />
          <div className="skeleton ml-auto h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

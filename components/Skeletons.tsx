export function PostSkeleton() {
  return (
    <article className="notch panel p-4">
      <div className="flex items-center gap-2">
        <div className="skeleton h-6 w-6" />
        <div className="skeleton h-3 w-28" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="skeleton h-6 w-14" />
        <div className="skeleton h-6 w-14" />
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

export function WarSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="notch panel h-16" />
      ))}
    </div>
  );
}

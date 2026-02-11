export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-muted/50 animate-pulse border border-border/30"
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="h-6 bg-muted/50 rounded-lg w-1/3 animate-pulse" />
      <div className="space-y-3">
        <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
        <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-muted/50 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  )
}

export function SkeletonDetailPanel() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-muted/50 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-muted/50 rounded w-2/3 animate-pulse" />
      </div>

      {/* Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Shown while a lazy-loaded page chunk is being fetched.
 * Matches the app layout so there's no jarring layout shift.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 p-4 md:p-6 lg:p-8">
      {/* Toolbar-style row */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Card rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div
              className="h-3.5 rounded-full bg-slate-200 dark:bg-slate-800"
              style={{ width: `${60 + (i % 3) * 15}%` }}
            />
            <div className="h-2.5 w-1/3 rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
          <div className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

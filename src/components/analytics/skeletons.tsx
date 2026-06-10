import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_HEIGHTS = [96, 148, 72, 170, 118, 196, 134];
const ROW_WIDTHS = [82, 64, 91, 48, 70];

/**
 * Chart-shaped shimmer placeholder. "columns" mimics line/column charts,
 * "rows" mimics horizontal bar charts.
 */
export function ChartSkeleton({
  layout = "columns",
  bars = 7,
}: {
  layout?: "columns" | "rows";
  bars?: number;
}) {
  if (layout === "rows") {
    return (
      <div
        className="flex h-[240px] flex-col justify-center gap-5 py-2"
        role="status"
        aria-label="Loading chart"
      >
        {ROW_WIDTHS.slice(0, bars).map((width, i) => (
          <div key={i}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-6" />
            </div>
            <Skeleton
              className="h-2 rounded-full"
              style={{ width: `${width}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex h-[240px] items-end gap-3 px-1 pb-1 pt-6"
      role="status"
      aria-label="Loading chart"
    >
      {COLUMN_HEIGHTS.slice(0, bars).map((height, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <Skeleton
            className="w-full rounded-t-md"
            style={{ height: `${height}px` }}
          />
          <Skeleton className="h-2.5 w-9" />
        </div>
      ))}
    </div>
  );
}

/** Shimmer placeholder matching the email history card layout. */
export function EmailHistorySkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading email history">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between border-b pb-3">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-4 space-y-2 rounded-md border p-4">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <div className="mt-4 flex items-center gap-2 border-t pt-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

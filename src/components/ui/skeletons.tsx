import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CELL_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2", "w-2/3", "w-1/3", "w-1/2"];

interface TableRowsSkeletonProps {
  rows?: number;
  cols?: number;
  cellClassName?: string;
}

/** Shimmer rows for a <tbody> while table data loads. */
export function TableRowsSkeleton({
  rows = 5,
  cols = 5,
  cellClassName = "px-4 py-3",
}: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b last:border-b-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className={cellClassName}>
              <Skeleton className={cn("h-4", CELL_WIDTHS[(r + c) % CELL_WIDTHS.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface TableSkeletonProps extends TableRowsSkeletonProps {
  className?: string;
  showHeader?: boolean;
}

/** Shimmer placeholder for a full table (header + rows). */
export function TableSkeleton({
  rows = 5,
  cols = 5,
  cellClassName = "px-4 py-3",
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border bg-white", className)}
      role="status"
      aria-label="Loading"
    >
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr className="border-b bg-gray-50">
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className={cn("text-left", cellClassName)}>
                  <Skeleton className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          <TableRowsSkeleton rows={rows} cols={cols} cellClassName={cellClassName} />
        </tbody>
      </table>
    </div>
  );
}

/** Shimmer rows for simple title + subtitle lists. */
export function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" role="status" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2 p-4">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}

/** Shimmer placeholder for label + input form sections. */
export function FormFieldsSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4 p-4" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationFooterProps {
  /** Total number of items before slicing */
  total: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Whether to show the local timezone text after the count */
  showTimezone?: boolean;
}

/** Returns page numbers with ellipsis sentinels ('…') for long ranges */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export function PaginationFooter({
  total,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  showTimezone = true,
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp silently (happens after filter/sort shrinks the list)
  const safePage   = Math.min(currentPage, totalPages);
  const from       = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to         = Math.min(safePage * pageSize, total);

  return (
    <div className="border-t border-border/40 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#1C1C1E]">
      {/* Left: count + timezone */}
      <p className="text-[10px] text-muted-foreground order-last sm:order-first shrink-0">
        {total === 0
          ? "No tasks found"
          : `Showing ${from}–${to} of ${total} task${total !== 1 ? "s" : ""}`}
        {showTimezone && (
          <span className="text-muted-foreground/50 ml-1">
            · {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </span>
        )}
      </p>

      <div className="flex items-center gap-4">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <div className="flex gap-1">
            {[5, 10, 15].map((size) => (
              <button
                key={size}
                onClick={() => { onPageSizeChange(size); onPageChange(1); }}
                className={`h-6 w-7 rounded text-[10px] font-semibold transition-all ${
                  pageSize === size
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/40"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {buildPageList(safePage, totalPages).map((page, idx) =>
            page === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="text-[10px] text-muted-foreground px-1 select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                aria-current={page === safePage ? "page" : undefined}
                className={`h-6 min-w-[24px] px-1.5 rounded text-[10px] font-semibold transition-all ${
                  page === safePage
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border/40"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

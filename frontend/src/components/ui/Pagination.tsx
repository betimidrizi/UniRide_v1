import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Number of pages to display in the middle when collapsed. Default 5. */
  siblingCount?: number;
  className?: string;
  /** Show item-range label e.g. "1–10 of 124". */
  showRangeLabel?: boolean;
}

type Item = number | 'ellipsis-left' | 'ellipsis-right';

function buildRange(current: number, totalPages: number, siblingCount: number): Item[] {
  // When pages <= 7, show all
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: Item[] = [];
  const leftSibling = Math.max(2, current - Math.floor(siblingCount / 2));
  const rightSibling = Math.min(totalPages - 1, current + Math.floor(siblingCount / 2));

  items.push(1);
  if (leftSibling > 2) items.push('ellipsis-left');
  for (let i = leftSibling; i <= rightSibling; i++) items.push(i);
  if (rightSibling < totalPages - 1) items.push('ellipsis-right');
  items.push(totalPages);
  return items;
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  siblingCount = 3,
  className,
  showRangeLabel = true
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const items = useMemo(
    () => buildRange(safePage, totalPages, siblingCount),
    [safePage, totalPages, siblingCount]
  );

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(total, safePage * pageSize);

  const go = (p: number) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== safePage) onPageChange(clamped);
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      {showRangeLabel && (
        <p className="text-xs text-slate-400">
          {total === 0 ? (
            'No results'
          ) : (
            <>
              <span className="text-slate-200 font-medium">
                {startIdx.toLocaleString()}–{endIdx.toLocaleString()}
              </span>{' '}
              of <span className="text-slate-200 font-medium">{total.toLocaleString()}</span>
            </>
          )}
        </p>
      )}
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => go(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className={cn(
              'inline-flex items-center gap-1 px-2.5 h-9 rounded-lg text-sm transition-colors',
              'text-slate-300 hover:bg-white/5 hover:text-white',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        </li>

        {items.map((item, idx) => {
          if (item === 'ellipsis-left' || item === 'ellipsis-right') {
            return (
              <li key={`${item}-${idx}`} aria-hidden>
                <span className="grid place-items-center size-9 text-slate-500">
                  <MoreHorizontal className="size-4" />
                </span>
              </li>
            );
          }
          const selected = item === safePage;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => go(item)}
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  'grid place-items-center size-9 rounded-lg text-sm font-medium transition-all',
                  selected
                    ? 'bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-glow'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                {item}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            onClick={() => go(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className={cn(
              'inline-flex items-center gap-1 px-2.5 h-9 rounded-lg text-sm transition-colors',
              'text-slate-300 hover:bg-white/5 hover:text-white',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

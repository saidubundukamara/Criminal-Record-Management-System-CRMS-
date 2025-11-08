/**
 * Pagination Component
 *
 * Reusable pagination component for navigating through paginated data
 *
 * CRMS - Pan-African Digital Public Good
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showNumbers?: boolean;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showNumbers = true,
  maxVisiblePages = 5,
}: PaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - halfVisible, 1);
    const end = Math.min(start + maxVisiblePages - 1, totalPages);

    // Adjust start if we're near the end
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = showNumbers ? getVisiblePages() : [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {/* First Page Button */}
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      {showNumbers && (
        <div className="flex items-center gap-1">
          {/* Show ellipsis if not starting at page 1 */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                variant="outline"
                onClick={() => handlePageChange(1)}
                className="w-10"
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              onClick={() => handlePageChange(page)}
              className="w-10"
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Button>
          ))}

          {/* Show ellipsis if not ending at last page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant="outline"
                onClick={() => handlePageChange(totalPages)}
                className="w-10"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last Page Button */}
      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}

      {/* Page Info */}
      {showNumbers && (
        <span className="ml-2 text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      )}
    </div>
  );
}

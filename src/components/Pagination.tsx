import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, loading, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2 p-3">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || loading}
        className="bg-slate-900/60 text-slate-100 ring-1 ring-white/10"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {page === 1 ? "Prev" : "Previous"}
      </Button>
      <span className="text-sm tabular-nums text-slate-300">
        Page {page} / {Math.max(1, totalPages)}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(page < totalPages ? page + 1 : page)}
        disabled={page >= totalPages || loading}
        className="bg-slate-900/60 text-slate-100 ring-1 ring-white/10"
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
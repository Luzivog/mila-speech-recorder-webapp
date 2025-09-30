import { useEffect, useMemo, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UtteranceRow } from "@/components/UtteranceRow";
import { Pagination } from "@/components/Pagination";
import type { UtteranceRow as UtteranceRowType } from "@/types/utterance";
import { Spinner } from "./ui/shadcn-io/spinner";

interface UtterancesTableProps {
  rows: UtteranceRowType[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string, selected: boolean) => void;
  onToggleAll: (ids: string[], selected: boolean) => void;
}

export function UtterancesTable({
  rows,
  loading,
  page,
  totalPages,
  onPageChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: UtterancesTableProps) {
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  const pageIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const selectedOnPage = useMemo(
    () => pageIds.filter((id) => selectedIds.has(id)),
    [pageIds, selectedIds]
  );
  const allSelected = selectedOnPage.length > 0 && selectedOnPage.length === pageIds.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Scrollable table wrapper */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-40 bg-gradient-to-r from-purple-50/90 to-indigo-50/90 backdrop-blur-sm">
              <TableRow className="[&>th]:border-b [&>th]:border-purple-200/60">
                <TableHead className="w-12">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allSelected}
                    onChange={(event) => onToggleAll(pageIds, event.target.checked)}
                    disabled={loading || pageIds.length === 0}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-400"
                  />
                </TableHead>
                <TableHead className="w-[170px] text-gray-700 font-semibold">Created</TableHead>
                <TableHead className="w-[120px] text-gray-700 font-semibold">Language</TableHead>
                <TableHead className="text-gray-700 font-semibold min-w-0">Text</TableHead>
                <TableHead className="w-[200px] text-gray-700 font-semibold">Speaker Name</TableHead>
                <TableHead className="w-[220px] text-gray-700 font-semibold">Audio</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                    No rows found.
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => (
                <UtteranceRow
                  key={row.id}
                  utterance={row}
                  selected={selectedIds.has(row.id)}
                  onSelectChange={(selected) => onToggleRow(row.id, selected)}
                  disabled={loading}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75 backdrop-blur-sm">
            <Spinner className="h-14 w-14 text-primary" variant="ring" />
          </div>
        )}
      </div>

      {/* Pagination bottom */}
      <Pagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
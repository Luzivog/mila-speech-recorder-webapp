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

interface UtterancesTableProps {
  rows: UtteranceRowType[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UtterancesTable({
  rows,
  loading,
  page,
  totalPages,
  onPageChange,
}: UtterancesTableProps) {
  return (
    <>
      {/* Pagination top */}
      <Pagination 
        page={page} 
        totalPages={totalPages} 
        loading={loading} 
        onPageChange={onPageChange} 
      />

      {/* Scrollable table wrapper */}
      <div className="min-h-0 flex-1 overflow-auto">
        <Table className="w-full">
          <TableHeader className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur">
            <TableRow className="[&>th]:border-b [&>th]:border-white/10">
              <TableHead className="w-[170px] text-slate-300">Created</TableHead>
              <TableHead className="w-[120px] text-slate-300">Language</TableHead>
              <TableHead className="text-slate-300">Text</TableHead>
              <TableHead className="w-[200px] text-slate-300">Speaker ID</TableHead>
              <TableHead className="w-[200px] text-slate-300">Device ID</TableHead>
              <TableHead className="w-[220px] text-slate-300">Audio</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                  No rows found.
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => (
              <UtteranceRow key={row.id} utterance={row} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination bottom */}
      <Pagination 
        page={page} 
        totalPages={totalPages} 
        loading={loading} 
        onPageChange={onPageChange} 
      />
    </>
  );
}
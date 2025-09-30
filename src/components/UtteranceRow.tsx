import { supabase } from "@/lib/supabase";
import { TableCell, TableRow } from "@/components/ui/table";
import type { UtteranceRow as UtteranceRowType } from "@/types/utterance";
import { BUCKET_NAME } from "@/constants/app";

interface UtteranceRowProps {
  utterance: UtteranceRowType;
}

export function UtteranceRow({ utterance }: UtteranceRowProps) {
  const storageKey = utterance.recordings?.[0]?.storage_key ?? null;
  const publicUrl = storageKey
    ? supabase.storage.from(BUCKET_NAME).getPublicUrl(storageKey).data.publicUrl
    : null;

  return (
    <TableRow className="transition-colors hover:bg-white/5 [&>td]:border-b [&>td]:border-white/5">
      <TableCell className="whitespace-nowrap text-sm text-slate-300">
        {utterance.created_at ? new Date(utterance.created_at).toLocaleString() : "—"}
      </TableCell>
      <TableCell className="font-medium text-slate-100">
        {utterance.language ?? "—"}
      </TableCell>
      <TableCell className="max-w-3xl truncate text-slate-200">
        {utterance.text ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-400">
        {utterance.speaker_id ?? "—"}
      </TableCell>
      <TableCell className="font-mono text-xs text-slate-400">
        {utterance.device_id ?? "—"}
      </TableCell>
      <TableCell>
        {publicUrl ? (
          <audio
            controls
            preload="none"
            className="w-[200px] rounded-lg ring-1 ring-white/10"
            src={publicUrl}
          />
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
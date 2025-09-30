import { supabase } from "@/lib/supabase";
import { TableCell, TableRow } from "@/components/ui/table";
import type { UtteranceRow as UtteranceRowType } from "@/types/utterance";
import { BUCKET_NAME } from "@/constants/app";

interface UtteranceRowProps {
  utterance: UtteranceRowType;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function UtteranceRow({ utterance, selected, onSelectChange, disabled = false }: UtteranceRowProps) {
  const storageKey = utterance.recordings?.[0]?.storage_key ?? null;
  const publicUrl = storageKey
    ? supabase.storage.from(BUCKET_NAME).getPublicUrl(storageKey).data.publicUrl
    : null;

  return (
    <TableRow
      className="data-[selected=true]:bg-purple-100/40 transition-colors hover:bg-purple-50/50 [&>td]:border-b [&>td]:border-purple-100/60"
      data-selected={selected ? "true" : undefined}
    >
      <TableCell className="w-12">
        <input
          type="checkbox"
          aria-label={`Select utterance ${utterance.id}`}
          checked={selected}
          onChange={(event) => onSelectChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-400"
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {utterance.created_at ? new Date(utterance.created_at).toLocaleString() : "—"}
      </TableCell>
      <TableCell className="font-medium text-gray-800">
        {utterance.language ?? "—"}
      </TableCell>
      <TableCell
        className="max-w-[min(60vw,45rem)] truncate text-gray-700"
        title={utterance.text ?? undefined}
      >
        {(utterance.text) ?? "—"} 
      </TableCell>
      <TableCell className="font-mono text-xs text-gray-500">
        {!utterance.speaker || utterance.speaker.display_name === "default" ? "Not specified" : utterance.speaker.display_name}
      </TableCell>
      <TableCell>
        {publicUrl ? (
          <audio
            controls
            preload="none"
            className="w-[200px] rounded-lg border border-purple-200/60 shadow-sm"
            src={publicUrl}
          />
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
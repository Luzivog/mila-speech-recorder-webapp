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
  const createdAtDisplay = utterance.created_at
    ? new Date(utterance.created_at).toLocaleString()
    : "—";
  const languageDisplay = utterance.language ?? "—";
  const textDisplay = utterance.text ?? "—";
  const speakerName = utterance.speaker?.display_name ?? "";
  const speakerDisplay =
    !speakerName || speakerName === "default" ? "Not specified" : speakerName;

  return (
    <TableRow
      className="data-[selected=true]:bg-purple-100/40 transition-colors hover:bg-purple-50/50 [&>td]:border-b [&>td]:border-purple-100/60"
      data-selected={selected ? "true" : undefined}
    >
      <TableCell className="w-12 shrink-0">
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
        <span
          className="block max-w-[9rem] truncate"
          title={createdAtDisplay !== "—" ? createdAtDisplay : undefined}
        >
          {createdAtDisplay}
        </span>
      </TableCell>
      <TableCell className="font-medium text-gray-800">
        <span
          className="block max-w-[6rem] truncate"
          title={languageDisplay !== "—" ? languageDisplay : undefined}
        >
          {languageDisplay}
        </span>
      </TableCell>
      <TableCell className="text-gray-700 min-w-0">
        <span
          className="block w-full truncate"
          title={textDisplay !== "—" ? textDisplay : undefined}
        >
          {textDisplay}
        </span>
      </TableCell>
      <TableCell
        className="font-mono text-xs text-gray-500"
      >
        <span
          className="block max-w-[10rem] truncate"
          title={speakerDisplay !== "Not specified" ? speakerDisplay : undefined}
        >
          {speakerDisplay}
        </span>
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
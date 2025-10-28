import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface HeaderProps {
  language: string;
  onLanguageChange: (language: string) => void;
  speaker: string;
  onSpeakerChange: (speaker: string) => void;
  selectedCount: number;
  filteredCount: number;
  onDownload: () => void;
  onDownloadFiltered: () => void;
  downloading: boolean;
}

export function Header({
  language,
  onLanguageChange,
  speaker,
  onSpeakerChange,
  selectedCount,
  filteredCount,
  onDownload,
  onDownloadFiltered,
  downloading,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">

      <h1 className="text-2xl font-semibold tracking-tight text-gray-800">
        Recordings
      </h1>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by speaker name (e.g., Jane Doe)…"
          value={speaker}
          onChange={(e) => onSpeakerChange(e.target.value)}
          className="w-72 bg-white/70 border-purple-200 text-gray-800 placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-300"
        />

        <Input
          placeholder="Filter by language (e.g., en, fr, English)…"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-72 bg-white/70 border-purple-200 text-gray-800 placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-300"
        />

        <Button
          type="button"
          onClick={onDownloadFiltered}
          disabled={downloading || filteredCount === 0}
          className="bg-purple-600 text-grey-800 shadow-sm hover:bg-purple-500"
        >
          <Download className="size-4" />
          {downloading
            ? "Preparing…"
            : filteredCount === 0
            ? "Download filtered"
            : `Download filtered (${filteredCount})`}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onDownload}
          disabled={downloading || selectedCount === 0}
          className="bg-white/80 border-purple-200 text-purple-700 hover:bg-purple-100/70"
        >
          <Download className="size-4" />
          {downloading
            ? "Preparing…"
            : selectedCount === 0
            ? "Download selected"
            : `Download selected (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}
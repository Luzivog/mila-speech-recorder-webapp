import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface HeaderProps {
  language: string;
  onLanguageChange: (language: string) => void;
  selectedCount: number;
  onDownload: () => void;
  downloading: boolean;
}

export function Header({
  language,
  onLanguageChange,
  selectedCount,
  onDownload,
  downloading,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">

      <h1 className="text-2xl font-semibold tracking-tight text-gray-800">
        Recordings
      </h1>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by language (e.g., en, fr, English)…"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-72 bg-white/70 border-purple-200 text-gray-800 placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-300"
        />

        <Button
          type="button"
          variant="outline"
          onClick={onDownload}
          disabled={downloading || selectedCount === 0}
          className="bg-white/80 border-purple-200 text-purple-700 hover:bg-purple-100/70"
        >
          <Download className="size-4" />
          {downloading ? "Preparing…" : selectedCount === 0 ? "Download" : `Download (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}
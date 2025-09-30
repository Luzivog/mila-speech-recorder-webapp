import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

interface HeaderProps {
  count: number;
  loading: boolean;
  language: string;
  onLanguageChange: (language: string) => void;
  dark: boolean;
  onThemeToggle: () => void;
}

export function Header({ 
  count, 
  loading, 
  language, 
  onLanguageChange, 
  dark, 
  onThemeToggle 
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Utterances</h1>
        <span className="rounded-full bg-slate-800/60 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
          {loading ? "Loading…" : `${count} total`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by language (e.g., en, fr, English)…"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-72 bg-slate-900/60 text-slate-100 placeholder:text-slate-400 ring-1 ring-white/10"
        />
        <Button
          variant="outline"
          className="bg-slate-900/60 text-slate-100 ring-1 ring-white/10"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
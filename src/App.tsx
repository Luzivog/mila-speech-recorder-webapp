import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { UtterancesTable } from "@/components/UtterancesTable";
import { useTheme } from "@/hooks/useTheme";
import { useUtterances } from "@/hooks/useUtterances";

function App() {
  const { dark, setDark } = useTheme();
  const {
    rows,
    count,
    page,
    setPage,
    language,
    setLanguage,
    loading,
    error,
    totalPages,
    debouncedLang,
  } = useUtterances();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 dark:from-slate-950 dark:via-black dark:to-black">
      <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Header
          count={count}
          loading={loading}
          language={language}
          onLanguageChange={setLanguage}
          dark={dark}
          onThemeToggle={() => setDark((d) => !d)}
        />

        <Card className="flex min-h-0 flex-1 overflow-hidden border-white/10 bg-slate-900/40 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-slate-200">
              {loading
                ? "Loading…"
                : `Showing ${rows.length} ${debouncedLang ? `results for "${debouncedLang}"` : "rows"}`}
              {error && <span className="ml-2 text-sm text-red-400">— {error}</span>}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
            <UtterancesTable
              rows={rows}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;

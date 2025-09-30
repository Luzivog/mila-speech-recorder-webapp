import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { UtterancesTable } from "@/components/UtterancesTable";
import { useUtterances } from "@/hooks/useUtterances";
import { useSelectableIds } from "@/hooks/useSelectableIds";
import { useUtteranceDownload } from "@/hooks/useUtteranceDownload";

function App() {
  const {
    rows,
    page,
    setPage,
    count,
    language,
    setLanguage,
    loading,
    totalPages,
    debouncedLang,
  } = useUtterances();

  const {
    selectedIds,
    selectedCount,
    toggleRow,
    toggleMany,
  } = useSelectableIds();

  const { downloading, downloadByIds, downloadFiltered } = useUtteranceDownload();

  const handleDownload = useCallback(() => {
    if (downloading || selectedIds.size === 0) {
      return;
    }

    void downloadByIds(Array.from(selectedIds));
  }, [downloadByIds, downloading, selectedIds]);

  const handleDownloadFiltered = useCallback(() => {
    if (downloading || count === 0) {
      return;
    }

    void downloadFiltered({ language: debouncedLang });
  }, [count, debouncedLang, downloadFiltered, downloading]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30">
      <div className="flex w-full min-h-screen max-h-screen flex-col gap-6 p-6 md:p-8">
        <Header
          language={language}
          onLanguageChange={setLanguage}
          selectedCount={selectedCount}
          filteredCount={count}
          downloading={downloading}
          onDownload={handleDownload}
          onDownloadFiltered={handleDownloadFiltered}
        />

        <Card className="flex min-h-0 flex-1 overflow-hidden border-purple-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-purple-100/50 ring-1 ring-purple-100/50">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
            <UtterancesTable
              rows={rows}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleMany}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;

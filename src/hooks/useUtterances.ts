import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UtteranceRow } from "@/types/utterance";
import { PAGE_SIZE } from "@/constants/app";
import { normalizeUtteranceRows } from "@/lib/utterances";

export function useUtterances() {
  const [rows, setRows] = useState<UtteranceRow[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [language, setLanguage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => (page - 1) * PAGE_SIZE, [page]);
  const to = useMemo(() => from + PAGE_SIZE - 1, [from]);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // debounce language input
  const [debouncedLang, setDebouncedLang] = useState(language);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLang(language.trim()), 300);
    return () => clearTimeout(t);
  }, [language]);

  useEffect(() => setPage(1), [debouncedLang]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // Join utterances -> recordings (assuming FK recordings.utterance_id -> utterances.id)
      let q = supabase
        .from("utterances")
        .select(
          "id, device_id, speaker_id, idx, text, created_at, language, speaker:speakers(display_name, gender, age), recordings(storage_key, ext)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedLang) q = q.ilike("language", `%${debouncedLang}%`);

      const { data, count: c, error: e } = await q;

      if (!cancelled) {
        if (e) {
          setError(e.message);
          setRows([]);
          setCount(0);
        } else {
          setRows(normalizeUtteranceRows(data));
          setCount(c ?? 0);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [from, to, debouncedLang]);

  return {
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
  };
}
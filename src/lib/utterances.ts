import type { UtteranceRow, RecordingRef } from "@/types/utterance";

type RawSpeaker = { display_name: string | null } | { display_name: string | null }[] | null | undefined;
type RawRecording = RecordingRef | RecordingRef[] | null | undefined;

type RawUtterance = {
  id: string;
  idx?: number | null;
  text?: string | null;
  created_at?: string | null;
  language?: string | null;
  speaker?: RawSpeaker;
  recordings?: RawRecording;
};

function normalizeSpeaker(raw: RawSpeaker): UtteranceRow["speaker"] {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw[0] ? { display_name: raw[0].display_name ?? null } : null;
  }
  return { display_name: raw.display_name ?? null };
}

function normalizeRecordings(raw: RawRecording): RecordingRef[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  return [raw];
}

export function normalizeUtteranceRows(data: unknown[] | null | undefined): UtteranceRow[] {
  if (!data) return [];

  return (data as RawUtterance[]).map((row) => ({
    id: row.id,
    idx: row.idx ?? null,
    text: row.text ?? null,
    created_at: row.created_at ?? null,
    language: row.language ?? null,
    recordings: normalizeRecordings(row.recordings),
    speaker: normalizeSpeaker(row.speaker),
  }));
}

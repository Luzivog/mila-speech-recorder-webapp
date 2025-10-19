import type { UtteranceRow, RecordingRef } from "@/types/utterance";

type RawSpeakerValue = {
  display_name: string | null;
  gender?: string | null;
  age?: number | string | null;
};

type RawSpeaker = RawSpeakerValue | RawSpeakerValue[] | null | undefined;
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

function toSpeakerValue(value: RawSpeakerValue | undefined): UtteranceRow["speaker"] {
  if (!value) return null;

  const genderRaw = value.gender ?? "";
  const genderNormalized = genderRaw.trim() || "unspecified";

  const ageRaw = value.age;
  let ageNumber: number | undefined;

  if (typeof ageRaw === "number") {
    ageNumber = Number.isFinite(ageRaw) ? ageRaw : undefined;
  } else if (typeof ageRaw === "string" && ageRaw.trim()) {
    const parsed = Number(ageRaw);
    if (Number.isFinite(parsed)) {
      ageNumber = parsed;
    }
  }

  let normalizedAge = Number.NaN;
  if (typeof ageNumber === "number") {
    normalizedAge = Math.trunc(ageNumber);
  }

  return {
    display_name: value.display_name ?? null,
    gender: genderNormalized,
    age: normalizedAge,
  };
}

function normalizeSpeaker(raw: RawSpeaker): UtteranceRow["speaker"] {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return toSpeakerValue(raw[0]);
  }
  return toSpeakerValue(raw);
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

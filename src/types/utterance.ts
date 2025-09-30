export type RecordingRef = {
  storage_key: string | null;
  ext: string | null;
  status: string | null;
};

export type UtteranceRow = {
  id: string;
  idx: number | null;
  text: string | null;
  created_at: string | null;
  language: string | null;
  recordings?: RecordingRef[]; // via FK utterances.id -> recordings.utterance_id
  speaker?: {
    display_name: string | null;
  } | null;
};
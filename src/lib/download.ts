import type { UtteranceRow } from "@/types/utterance";

const ZIP_FOLDER_PREFIX = "utterance";

function slugifySegment(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;

  const stripped = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const sanitized = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const trimmed = sanitized.slice(0, 40);
  return trimmed || fallback;
}

export function getSpeakerDisplayName(utterance: UtteranceRow): string {
  const name = utterance.speaker?.display_name?.trim();
  if (!name || name.toLowerCase() === "default") {
    return "Not specified";
  }
  return name;
}

export function buildUtteranceFolderName(utterance: UtteranceRow, index: number): string {
  const languageSegment = slugifySegment(utterance.language, "unknown");
  const textFallback = `idx-${utterance.idx ?? index + 1}`;
  const textSegment = slugifySegment(utterance.text, textFallback);
  const idSegment = utterance.id.slice(0, 8);

  return `${ZIP_FOLDER_PREFIX}-${languageSegment}-${textSegment}-${idSegment}`;
}

export function createMetadataCsv(utterance: UtteranceRow): string {
  const headers = ["text", "language", "speaker_name"];
  const values = [
    utterance.text ?? "",
    utterance.language ?? "",
    getSpeakerDisplayName(utterance),
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [headers.join(","), values.map(escape).join(",")].join("\n");
}

export function formatTimestampForFilename(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

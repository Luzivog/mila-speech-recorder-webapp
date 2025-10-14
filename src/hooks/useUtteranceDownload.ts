import { useCallback, useState } from "react";
import JSZip from "jszip";

import { supabase } from "@/lib/supabase";
import { BUCKET_NAME } from "@/constants/app";
import { normalizeUtteranceRows } from "@/lib/utterances";
import type { UtteranceRow as UtteranceRowType } from "@/types/utterance";
import {
  buildUtteranceFolderName,
  createMetadataCsv,
  formatTimestampForFilename,
} from "@/lib/download";

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;
type FetchFileFn = typeof import("@ffmpeg/util").fetchFile;

const UTTERANCE_SELECT_COLUMNS =
  "id, idx, text, created_at, language, speaker:speakers(display_name), recordings(storage_key, ext)";

const FILTER_FETCH_BATCH_SIZE = 100;

type AudioAsset = {
  buffer: ArrayBuffer;
  filename: string;
};

let ffmpegSetupPromise:
  | Promise<{ ffmpeg: FFmpegInstance; fetchFile: FetchFileFn }>
  | null = null;

function createUniqueFileId() {
  return Math.random().toString(36).slice(2);
}

async function getFFmpeg() {
  if (typeof window === "undefined") {
    throw new Error("Audio conversion is only supported in the browser.");
  }

  if (!ffmpegSetupPromise) {
    ffmpegSetupPromise = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      return { ffmpeg, fetchFile };
    })();
  }

  return ffmpegSetupPromise;
}

async function convertM4AToWav(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const { ffmpeg, fetchFile } = await getFFmpeg();
  const fileId = createUniqueFileId();
  const inputName = `${fileId}.m4a`;
  const outputName = `${fileId}.wav`;

  const inputData = await fetchFile(new Blob([buffer]));
  await ffmpeg.writeFile(inputName, inputData);

  try {
    const exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-c:a",
      "pcm_s16le",
      outputName,
    ]);

    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}`);
    }

    const outputData = await ffmpeg.readFile(outputName);

    if (!(outputData instanceof Uint8Array)) {
      throw new Error("Unexpected data format returned from FFmpeg.");
    }

    const normalized = new Uint8Array(outputData);
    return normalized.buffer;
  } catch (err) {
    throw new Error("Failed to convert audio to WAV.", { cause: err });
  } finally {
    try {
      await ffmpeg.deleteFile(inputName);
    } catch (cleanupErr) {
      console.warn("Failed to clean up temporary input file", cleanupErr);
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupErr) {
      console.warn("Failed to clean up temporary output file", cleanupErr);
    }
  }
}

async function fetchPrimaryRecordingBlob(
  utterance: UtteranceRowType,
): Promise<AudioAsset | null> {
  const recording = utterance.recordings?.find((rec) => rec?.storage_key);

  if (!recording?.storage_key) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(recording.storage_key);

  if (error || !data) {
    throw error ?? new Error(`Audio not found for utterance ${utterance.id}`);
  }

  const extension = (recording.ext ?? "").replace(/^\./, "").toLowerCase() || "wav";
  let filename = `audio.${extension}`;
  let buffer = await data.arrayBuffer();

  if (extension === "m4a") {
    buffer = await convertM4AToWav(buffer);
    filename = "audio.wav";
  }

  return { buffer, filename };
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

async function fetchUtterancesByIds(ids: string[]): Promise<UtteranceRowType[]> {
  if (!ids.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("utterances")
    .select(UTTERANCE_SELECT_COLUMNS)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return normalizeUtteranceRows(data);
}

async function fetchUtterancesByFilter(filters: {
  language?: string | null;
}): Promise<UtteranceRowType[]> {
  const utterances: UtteranceRowType[] = [];

  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("utterances")
      .select(UTTERANCE_SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, from + FILTER_FETCH_BATCH_SIZE - 1);

    const language = filters.language?.trim();
    if (language) {
      query = query.ilike("language", `%${language}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const normalized = normalizeUtteranceRows(data);
    utterances.push(...normalized);

    if (!data || data.length < FILTER_FETCH_BATCH_SIZE) {
      hasMore = false;
    } else {
      from += FILTER_FETCH_BATCH_SIZE;
    }
  }

  return utterances;
}

async function prepareAndDownloadZip(utterances: UtteranceRowType[]) {
  if (!utterances.length) {
    throw new Error("No data found for the requested utterances.");
  }

  const zip = new JSZip();
  const missingAudioFileName = "missing-audio.txt";
  const missingAudioMessage =
    "No audio file was available for this utterance's primary recording.";
  const audioTasks: Promise<void>[] = [];

  for (const [index, utterance] of utterances.entries()) {
    const folder = zip.folder(buildUtteranceFolderName(utterance, index));

    if (!folder) {
      console.warn(`Unable to create zip folder for utterance ${utterance.id}`);
      continue;
    }

    folder.file("metadata.csv", createMetadataCsv(utterance));

    audioTasks.push(
      (async () => {
        try {
          const audioAsset = await fetchPrimaryRecordingBlob(utterance);
          if (audioAsset) {
            folder.file(audioAsset.filename, audioAsset.buffer);
          } else {
            folder.file(missingAudioFileName, missingAudioMessage);
          }
        } catch (audioErr) {
          console.error(
            `Failed to download audio for utterance ${utterance.id}`,
            audioErr,
          );
          folder.file(
            missingAudioFileName,
            "Audio download failed for this utterance's primary recording.",
          );
        }
      })()
    );
  }

  await Promise.all(audioTasks);

  const blob = await zip.generateAsync({ type: "blob" });
  const fileName = `utterances-${formatTimestampForFilename(new Date())}.zip`;

  triggerBlobDownload(blob, fileName);
}

export function useUtteranceDownload() {
  const [downloading, setDownloading] = useState(false);

  const downloadByIds = useCallback(
    async (ids: string[]) => {
      if (!ids.length || downloading) {
        return;
      }

      setDownloading(true);

      try {
        const rows = await fetchUtterancesByIds(ids);
        const mapById = new Map(rows.map((row) => [row.id, row]));
        const orderedUtterances = ids
          .map((id) => mapById.get(id))
          .filter((row): row is UtteranceRowType => Boolean(row));

        await prepareAndDownloadZip(orderedUtterances);
      } catch (err) {
        console.error("Failed to prepare utterance download", err);
        if (typeof window !== "undefined") {
          const message = err instanceof Error ? err.message : "Download failed.";
          window.alert(`Download failed: ${message}`);
        }
      } finally {
        setDownloading(false);
      }
    },
    [downloading]
  );

  const downloadFiltered = useCallback(
    async (filters: { language?: string | null }) => {
      if (downloading) {
        return;
      }

      setDownloading(true);

      try {
        const utterances = await fetchUtterancesByFilter(filters);

        if (!utterances.length) {
          if (typeof window !== "undefined") {
            window.alert("No utterances match the current filters.");
          }
          return;
        }

        await prepareAndDownloadZip(utterances);
      } catch (err) {
        console.error("Failed to download filtered utterances", err);
        if (typeof window !== "undefined") {
          const message = err instanceof Error ? err.message : "Download failed.";
          window.alert(`Download failed: ${message}`);
        }
      } finally {
        setDownloading(false);
      }
    },
    [downloading]
  );

  return { downloading, downloadByIds, downloadFiltered };
}

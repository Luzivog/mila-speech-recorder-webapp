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

type AudioAsset = {
  buffer: ArrayBuffer;
  filename: string;
};

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

  const extension = (recording.ext ?? "").replace(/^\./, "") || "wav";
  const filename = `audio.${extension}`;
  const buffer = await data.arrayBuffer();

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

export function useUtteranceDownload() {
  const [downloading, setDownloading] = useState(false);

  const downloadByIds = useCallback(
    async (ids: string[]) => {
      if (!ids.length || downloading) {
        return;
      }

      setDownloading(true);

      try {
        const { data, error } = await supabase
          .from("utterances")
          .select(
            "id, idx, text, created_at, language, speaker:speakers(display_name), recordings(storage_key, ext, status)"
          )
          .in("id", ids);

        if (error) {
          throw new Error(error.message);
        }

        const rows = normalizeUtteranceRows(data);
        const mapById = new Map(rows.map((row) => [row.id, row]));
        const orderedUtterances = ids
          .map((id) => mapById.get(id))
          .filter((row): row is UtteranceRowType => Boolean(row));

        if (orderedUtterances.length === 0) {
          throw new Error("No data found for the selected utterances.");
        }

        const zip = new JSZip();

        for (const [index, utterance] of orderedUtterances.entries()) {
          const folder = zip.folder(buildUtteranceFolderName(utterance, index));

          if (!folder) {
            console.warn(`Unable to create zip folder for utterance ${utterance.id}`);
            continue;
          }

          folder.file("metadata.csv", createMetadataCsv(utterance));

          try {
            const audioAsset = await fetchPrimaryRecordingBlob(utterance);
            if (audioAsset) {
              folder.file(audioAsset.filename, audioAsset.buffer);
            } else {
              folder.file(
                "missing-audio.txt",
                "No audio file was available for this utterance's primary recording."
              );
            }
          } catch (audioErr) {
            console.error(`Failed to download audio for utterance ${utterance.id}`, audioErr);
            folder.file(
              "missing-audio.txt",
              "Audio download failed for this utterance's primary recording."
            );
          }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const fileName = `utterances-${formatTimestampForFilename(new Date())}.zip`;

        triggerBlobDownload(blob, fileName);
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

  return { downloading, downloadByIds };
}

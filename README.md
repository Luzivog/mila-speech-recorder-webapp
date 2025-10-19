# MILA Speech Recorder Webapp

Tooling for browsing and exporting speech utterances stored in Supabase. The app lists utterances with speaker metadata and lets analysts filter records by language, select specific rows, and download audio packages with metadata CSVs for downstream processing.

## Prerequisites
- Node.js 18 or newer (aligns with Vite + Supabase SDK requirements)
- [pnpm](https://pnpm.io/) 8+
- Supabase project with the required tables and a storage bucket (details below)

## Local Setup
1. **Install dependencies**
	```pwsh
	pnpm install
	```
2. **Configure environment variables**
	- Copy `.env.example` to `.env`.
	- Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your Supabase project credentials (Project Settings → API).
3. **Run the development server**
	```pwsh
	pnpm dev
	```
	Vite will print the local URL (default `http://localhost:5173`). The app hot-reloads on save.
4. **Build for production**
	```pwsh
	pnpm build
	```
	The build output lives in `dist/` and is compatible with static hosting providers such as Vercel (see `vercel.json`).

## Supabase Integration

### Required Tables & Relationships
The app relies on three interconnected tables. Column names shown are the ones referenced in the codebase (`src/hooks/useUtterances.ts`).

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `utterances` | Primary dataset displayed in the UI | `id` (UUID), `idx` (int), `text` (text), `language` (text), `created_at` (timestamp), `speaker_id` (FK) |
| `speakers` | Speaker metadata joined onto each utterance | `id`, `display_name`, `gender`, `age` |
| `recordings` | References to audio files stored in Supabase Storage | `id`, `utterance_id` (FK to `utterances.id`), `storage_key` (path in storage), `ext` (file extension) |

The hook `useUtterances` issues the following composite select:

```
select id, device_id, speaker_id, idx, text, created_at, language,
		 speaker:speakers(display_name, gender, age),
		 recordings(storage_key, ext)
from utterances
```

Supabase automatically expands the nested `speaker` and `recordings` objects through the foreign keys. Ensure RLS policies allow read access for the anonymous role used by the anon key.

### Storage Bucket
- Audio assets must be uploaded to a public (or anon-readable) bucket. The default bucket name in `src/constants/app.ts` is `recordings`.
- Each `recordings.storage_key` should match the object path inside the bucket (for example `utterances/{utterance_id}/audio.m4a`).
- The app downloads the first recording per utterance and converts `.m4a` files to `.wav` in-browser using `@ffmpeg/ffmpeg` so downstream consumers always get a WAV file.

### Environment Variables
The Supabase client is instantiated in `src/lib/supabase.ts`:

```ts
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(url, anon, { auth: { persistSession: false } });
```

Both variables are mandatory. When deploying, expose them as build-time environment variables so Vite can inline them.

## Data Fetching Flow

- **Initial load & pagination** (`useUtterances`): Fetches pages of utterances (12 per page) ordered by `created_at`. Optional language filtering is debounced to avoid excessive network calls.
- **Normalization** (`src/lib/utterances.ts`): Cleans Supabase responses—handles missing speaker metadata, coerces ages to integers, guarantees `recordings` is an array, and standardizes gender values.
- **Selection state** (`useSelectableIds`): Tracks which utterances are selected in the UI for batch operations.

## Packaging & Downloads

When the user triggers either “Download Selected” or “Download Filtered”:

1. **Record retrieval** (`useUtteranceDownload`): Fetches the relevant utterances (by specific IDs or paginated batches for filters) using the same column selection as the table view.
2. **Audio download** (`fetchPrimaryRecordingBlob`): Grabs the first `recordings` entry, downloads the file from the configured bucket, and converts `.m4a` to `.wav` via FFmpeg WebAssembly when necessary.
3. **Folder naming** (`buildUtteranceFolderName` in `src/lib/download.ts`): Generates a slugged folder like `utterance-en-hello-world-1a2b3c4d` combining language, text, and a short ID prefix.
4. **Metadata CSV** (`createMetadataCsv`): Writes `metadata.csv` containing text, language, speaker name, gender, and age. Missing fields are marked as “Not specified”.
5. **Zip packaging**: JSZip assembles folders into `utterances-YYYY-MM-DDTHH-MM-SSZ.zip` and triggers a browser download. If audio is absent or fails to download, the folder contains `missing-audio.txt` explaining the issue.

## Available Scripts
- `pnpm dev` – start Vite dev server with hot reload.
- `pnpm build` – type-check and build the production bundle.
- `pnpm preview` – preview the production build locally.
- `pnpm lint` – run ESLint with the project rules.

## Troubleshooting
- **Empty table**: Confirm the Supabase anon role can `select` from `utterances`, `speakers`, and `recordings`. Adjust RLS policies if needed.
- **Audio download failures**: Verify the storage bucket name matches `BUCKET_NAME` and the anon role has read access to the bucket objects.
- **FFmpeg errors**: Ensure downloads occur in a modern browser; FFmpeg WebAssembly requires `SharedArrayBuffer` support and sufficient memory.
- **Environment issues**: If `pnpm` is unavailable, install it with `npm install -g pnpm` or use `npx pnpm`.

## Deployment Notes
- The project targets static hosting. Any platform capable of serving a Vite `dist/` folder will work.
- Supply the Supabase variables at build time (for example, Vercel Project Settings → Environment Variables).
- If using a custom bucket name, update `src/constants/app.ts` and redeploy.


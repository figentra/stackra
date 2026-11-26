/**
 * Stackra file contract:
 * Purpose: the tus `Uploader` (`uploader: "tus"`): asks the media module's `upload.create_resumable` endpoint
 *          (`media.resumableUploadEndpoint`) for a resumable upload, starts it on the tus server with the headers the
 *          service gave, sends the bytes in `PATCH` chunks of `media.tus.chunkBytes`, and after a failed request pauses
 *          (`media.tus.retryDelaysMs`), asks the server how far it got (`HEAD`) and resumes from there. Returns the
 *          token once the server holds every byte.
 * Boundary: the bytes never pass through a service (ADR 0222 decision 2): they go to the tus server (tusd), which
 *           writes them to the store. The endpoint call carries the session cookie (`credentials: "include"`); the tus
 *           requests carry only the tus headers. Resumes within one `upload` call (a network drop, a tus server
 *           restart, a busy or locked upload); the creation `POST` is never repeated, since the service admits each
 *           upload once. Every answer is checked: a malformed service answer, a missing `Location`, an offset that
 *           does not move forward or passes the file's size is a refusal. Every failure is an `UploadFailedError`;
 *           neither the file nor a URL is ever logged or put in an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: tus uploads); ADR 0142 (drivers behind a port); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { z } from "zod";

import type { MediaConfig } from "#config/media.config";
import { TUS_VERSION } from "#core/constants/tus-version.constant";
import { UploadFailedError } from "#core/errors/upload-failed.error";
import { Uploader } from "#core/ports/uploader.port";
import { Upload } from "#core/values/upload.value";

/** The part of the `upload.create_resumable` answer the client needs. */
const RESUMABLE_UPLOAD = z.object({
  upload: Upload.schema,
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()),
});

/** tus answers worth a retry besides a server failure: offset conflict, locked, too many requests, checksum mismatch. */
const RETRYABLE = new Set([409, 423, 429, 460]);

/** `fetch`, with a network failure turned into an `UploadFailedError` of status 0. */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw UploadFailedError.create({ status: 0, serviceCode: null }, { cause: error });
  }
}

/** `fetch`, with a network failure answered as `null` so the caller can retry it. */
async function attempt(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}

/** The refusal for a failed service answer, with the service's refusal code when its body is an error envelope. */
async function failureOf(response: Response): Promise<UploadFailedError> {
  const body: unknown = await response.json().catch(() => null);
  const code = (body as { code?: unknown } | null)?.code;
  return UploadFailedError.create({
    status: response.status,
    serviceCode: typeof code === "string" ? code : null,
  });
}

/** The refusal for a tus answer of `status`. */
const refused = (status: number): UploadFailedError =>
  UploadFailedError.create({ status, serviceCode: null });

/** The `Upload-Offset` of `response` as a whole number of bytes, or `null` when it is missing or malformed. */
function offsetOf(response: Response): number | null {
  const text = response.headers.get("upload-offset");
  return text !== null && /^\d{1,15}$/.test(text) ? Number(text) : null;
}

/** `reference` resolved against `base`, itself resolved against the page in a browser. */
function resolved(reference: string, base: string): string {
  const page = (globalThis as { location?: { href?: string } }).location?.href;
  try {
    return new URL(reference, new URL(base, page)).href;
  } catch (error) {
    throw UploadFailedError.create({ status: 0, serviceCode: null }, { cause: error });
  }
}

/**
 * Uploads through a tus server, resuming after a failed request.
 *
 * @example
 * // runway.yaml (web app): config.media: { uploader: tus, tus: { endpoint: https://uploads.example.com/files/ } }
 * const upload = await container.get(Uploader).upload(file, "library.videos");
 */
export class TusUploaderDriver extends Driver(Uploader) {
  private readonly endpoint: string;

  private readonly chunkBytes: number;

  private readonly retryDelaysMs: readonly number[];

  /**
   * @param config - where to ask for a resumable upload (`resumableUploadEndpoint`) and how to send it (`tus`).
   */
  constructor(config: MediaConfig) {
    super();
    this.endpoint = config.resumableUploadEndpoint;
    this.chunkBytes = config.tus.chunkBytes;
    this.retryDelaysMs = [...config.tus.retryDelaysMs];
  }

  /** Asks for a resumable upload of `file`, sends its bytes to the tus server and returns the token. */
  async upload(file: Blob, bucket: string | null): Promise<Upload> {
    const asked = await send(this.endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ bucket, mediaType: file.type, size: file.size }),
    });
    if (!asked.ok) throw await failureOf(asked);
    const answer = RESUMABLE_UPLOAD.safeParse(await asked.json().catch(() => null));
    if (!answer.success) throw refused(asked.status);
    const location = await this.start(answer.data.url, answer.data.headers, file.size);
    await this.transfer(location, file);
    return answer.data.upload;
  }

  /** Creates the upload on the tus server and returns its URL. Never retried: the service admits an upload once. */
  private async start(
    url: string,
    headers: Readonly<Record<string, string>>,
    size: number,
  ): Promise<string> {
    const created = await send(url, {
      method: "POST",
      headers: { ...headers, "tus-resumable": TUS_VERSION, "upload-length": String(size) },
    });
    if (created.status !== 201) throw refused(created.status);
    const location = created.headers.get("location");
    if (location === null || location === "") throw refused(created.status);
    return resolved(location, url);
  }

  /**
   * Sends `file` from offset 0 until the server holds every byte. After a failed request it pauses, asks the server
   * for its offset and goes on from there; it gives up when the pauses run out without progress.
   */
  private async transfer(location: string, file: Blob): Promise<void> {
    let offset = 0;
    let failures = 0;
    let stale = false;
    while (stale || offset < file.size) {
      const response = stale
        ? // oxlint-disable-next-line no-await-in-loop -- tus sends one request at a time, each after the last
          await attempt(location, {
            method: "HEAD",
            headers: { "tus-resumable": TUS_VERSION, "cache-control": "no-store" },
          })
        : // oxlint-disable-next-line no-await-in-loop -- tus sends one request at a time, each after the last
          await attempt(location, {
            method: "PATCH",
            headers: {
              "tus-resumable": TUS_VERSION,
              "upload-offset": String(offset),
              "content-type": "application/offset+octet-stream",
            },
            body: file.slice(offset, offset + this.chunkBytes),
          });
      if (response !== null && response.ok) {
        const next = offsetOf(response);
        if (next === null || next > file.size || (!stale && next <= offset))
          throw refused(response.status);
        if (next > offset) failures = 0;
        offset = next;
        stale = false;
        continue;
      }
      const status = response?.status ?? 0;
      if (response !== null && !RETRYABLE.has(status) && status < 500) throw refused(status);
      const pause = this.retryDelaysMs[failures];
      if (pause === undefined) throw refused(status);
      failures += 1;
      // oxlint-disable-next-line no-await-in-loop -- the pause before the next try is the point
      await new Promise<void>((resume) => {
        setTimeout(resume, pause);
      });
      stale = true;
    }
  }
}

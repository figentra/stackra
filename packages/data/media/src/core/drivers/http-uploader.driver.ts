/**
 * Stackra file contract:
 * Purpose: the HTTP `Uploader` (`uploader: "http"`): asks the media module's `upload.create` endpoint
 *          (`media.uploadEndpoint`) for a signed URL, puts the file's bytes straight to the store with the signed
 *          headers, and returns the token.
 * Boundary: the bytes never pass through a service (ADR 0222 decision 2). The endpoint call carries the session cookie
 *           (`credentials: "include"`); the store call carries nothing but the signed headers. The service's answer is
 *           parsed, so a malformed one is a refusal, never a token built from it. Every failure is an
 *           `UploadFailedError`; neither the file nor the signed URL is ever logged or put in an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2); ADR 0142 (drivers behind a port); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { z } from "zod";

import type { MediaConfig } from "#config/media.config";
import { UploadFailedError } from "#core/errors/upload-failed.error";
import { Uploader } from "#core/ports/uploader.port";
import { Upload } from "#core/values/upload.value";

/** The part of the `upload.create` answer the client needs. */
const SIGNED_UPLOAD = z.object({
  upload: Upload.schema,
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()),
});

/** `fetch`, with a network failure turned into an `UploadFailedError` of status 0. */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw UploadFailedError.create({ status: 0, serviceCode: null }, { cause });
  }
}

/** The refusal for a failed answer, with the service's refusal code when its body is an error envelope. */
async function failureOf(response: Response): Promise<UploadFailedError> {
  const body: unknown = await response.json().catch(() => null);
  const code = (body as { code?: unknown } | null)?.code;
  return UploadFailedError.create({
    status: response.status,
    serviceCode: typeof code === "string" ? code : null,
  });
}

/**
 * Uploads through a signed URL.
 *
 * @example
 * // runway.yaml (web app): config.media: { uploader: http }
 * const upload = await container.get(Uploader).upload(file, null);
 */
export class HttpUploaderDriver extends Driver(Uploader) {
  private readonly endpoint: string;

  /**
   * @param config - where to ask for a signed URL (`uploadEndpoint`).
   */
  constructor(config: MediaConfig) {
    super();
    this.endpoint = config.uploadEndpoint;
  }

  /** Asks for a signed URL for `file`, puts the bytes there and returns the token. */
  async upload(file: Blob, bucket: string | null): Promise<Upload> {
    const asked = await send(this.endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ bucket, mediaType: file.type, size: file.size }),
    });
    if (!asked.ok) throw await failureOf(asked);
    const signed = SIGNED_UPLOAD.safeParse(await asked.json().catch(() => null));
    if (!signed.success)
      throw UploadFailedError.create({ status: asked.status, serviceCode: null });
    const put = await send(signed.data.url, {
      method: "PUT",
      headers: signed.data.headers,
      body: file,
    });
    if (!put.ok) throw UploadFailedError.create({ status: put.status, serviceCode: null });
    return signed.data.upload;
  }
}

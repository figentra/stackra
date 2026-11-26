/**
 * Stackra file contract:
 * Purpose: `TusHookController`, the raw endpoint tusd's HTTP hooks call (`POST /media/tus-hooks`, tusd
 *          `-hooks-http`): its `pre-create` hook asks `MediaLibrary.admitResumableUpload` whether the upload named in
 *          the creation request may start, and answers tusd with the id and metadata to store it under, or a rejection
 *          with the status the client sees. Every other hook type is acknowledged with no change.
 * Boundary: a raw controller is anonymous to the adapter, so the credential is the hook password: HTTP basic auth
 *           whose password must equal `MediaConfig.tusHookSecret` (compared as SHA-256 digests in constant time); an
 *           empty secret refuses every call, so no tus upload starts until it is set. The upload id is the only value
 *           taken from the client's metadata, and only as a lookup key: the stored id and media type come from the
 *           server's record, and tusd's metadata is replaced whole (`upload`, `filetype`), so a client cannot name a
 *           storage path or a type. Concatenated (partial or final) and deferred-length uploads are rejected. A body
 *           over 64 KiB, or one that is not a tusd hook request, is a 400. The refusal body names the code only, never
 *           the file.
 * Runtime: node
 * Governing contract: ADR 0222 (decision 2: tus uploads, services never stream the bytes); ADR 0294 (decisions 16 and
 *                     25: a raw endpoint is a Controller in `raw/`); ADR 0173 (the hook password is a `@Secret`).
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { Controller } from "@stackra/app/server";
import { z } from "zod";

import type { MediaConfig } from "#config/media.config";
import { UploadExpiredError } from "#core/errors/upload-expired.error";
import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import type { MediaLibrary } from "#core/services/media-library.service";

/** The largest hook request read: tusd's hook bodies are a few kilobytes. */
const MAX_BODY_BYTES = 65_536;

/** The part of a tusd v2 hook request this controller reads. */
const HOOK_REQUEST = z.object({
  Type: z.string(),
  Event: z.object({
    Upload: z.object({
      Size: z.number().int().min(0),
      SizeIsDeferred: z.boolean(),
      MetaData: z.record(z.string(), z.string()).nullable(),
      IsPartial: z.boolean(),
      IsFinal: z.boolean(),
    }),
  }),
});

/** A JSON answer of `status`. */
const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

/** The hook answer that rejects the creation request with `status` and the refusal `code`. */
const reject = (status: number, code: string): Response =>
  json(200, {
    RejectUpload: true,
    HTTPResponse: {
      StatusCode: status,
      Body: JSON.stringify({ code }),
      Header: { "Content-Type": "application/json" },
    },
  });

/** The SHA-256 digest of `text`, so two secrets compare in constant time whatever their lengths. */
const digestOf = (text: string): Buffer => createHash("sha256").update(text, "utf8").digest();

/** The password of an HTTP basic `authorization` header, or `null` when there is none. */
function passwordOf(header: string | null): string | null {
  const match = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(header ?? "");
  if (match === null) return null;
  const decoded = Buffer.from(match[1] ?? "", "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  return colon === -1 ? null : decoded.slice(colon + 1);
}

/**
 * Admits tus uploads for tusd.
 *
 * @example
 * // tusd -hooks-http https://tusd:<MEDIA_TUS_HOOK_SECRET>@api.example.com/media/tus-hooks -hooks-enabled-events pre-create
 * // POST /media/tus-hooks { Type: "pre-create", Event: { Upload: { MetaData: { upload: "upl_…" }, Size: 1024, … } } }
 * // → 200 { ChangeFileInfo: { ID: "upl_…", MetaData: { upload: "upl_…", filetype: "video/mp4" } } }
 */
export class TusHookController extends Controller({ path: "/media/tus-hooks" }) {
  /** The media library that admits uploads. */
  private readonly media: MediaLibrary;

  /** Holds the hook password (`tusHookSecret`). */
  private readonly config: MediaConfig;

  /**
   * @param media - the media library that admits uploads.
   * @param config - the media configuration holding the hook password.
   */
  constructor(media: MediaLibrary, config: MediaConfig) {
    super();
    this.media = media;
    this.config = config;
  }

  /** Answers one tusd hook call. */
  async handle(request: Request): Promise<Response> {
    if (request.method !== "POST")
      return json(405, { code: "method_not_allowed" }, { allow: "POST" });
    if (!this.authentic(request))
      return json(
        401,
        { code: "unauthenticated" },
        { "www-authenticate": 'Basic realm="tus-hooks"' },
      );
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) return json(413, { code: "too_large" });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return json(400, { code: "invalid_hook" });
    }
    const hook = HOOK_REQUEST.safeParse(body);
    if (!hook.success) return json(400, { code: "invalid_hook" });
    if (hook.data.Type !== "pre-create") return json(200, {});
    const upload = hook.data.Event.Upload;
    if (upload.IsPartial || upload.IsFinal) return reject(400, "upload_rejected");
    const id = upload.MetaData?.["upload"] ?? "";
    try {
      const admitted = await this.media.admitResumableUpload(
        id,
        upload.SizeIsDeferred ? null : upload.Size,
      );
      return json(200, {
        ChangeFileInfo: {
          ID: admitted.id,
          MetaData: { upload: admitted.id, filetype: admitted.mediaType },
        },
      });
    } catch (error) {
      if (error instanceof UploadIncompleteError) return reject(404, error.code);
      if (error instanceof UploadExpiredError) return reject(410, error.code);
      if (error instanceof UploadRejectedError)
        return reject(error.reason === "started" ? 409 : 400, error.code);
      throw error;
    }
  }

  /** Whether `request` carries the hook password; never while it is unset. */
  private authentic(request: Request): boolean {
    const secret = this.config.tusHookSecret;
    const given = passwordOf(request.headers.get("authorization"));
    if (secret === "" || given === null) return false;
    return timingSafeEqual(digestOf(given), digestOf(secret));
  }
}

/**
 * Stackra file contract:
 * Purpose: `ResumableUpload<B>`, what `MediaLibrary.createResumableUpload` returns: the token the client later sends to
 *          an action, the tus server's creation URL, the headers the client starts the tus upload with, and when the
 *          token stops working.
 * Boundary: a type only; the wire form is `CreateResumableUploadOutput` in `./node`. The headers carry the upload id in
 *           tus `Upload-Metadata` and nothing else; the client adds `Upload-Length`.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: tus uploads, services never stream the bytes).
 */
import type { BucketBase } from "#core/bases/bucket-base.base";
import type { Upload } from "#core/values/upload.value";

/** A tus upload that waits for the client's bytes. */
export interface ResumableUpload<B extends BucketBase = BucketBase> {
  /** The token to send to the claiming action. */
  readonly upload: Upload<B>;

  /** The tus server's creation URL (`media.tus.endpoint`): the client `POST`s there to start the upload. */
  readonly url: string;

  /** The headers to start the upload with, exactly as given (`tus-resumable`, `upload-metadata`). */
  readonly headers: Readonly<Record<string, string>>;

  /**
   * When the token expires (`resumableUploadExpiresIn` after creation); a claim after it is refused, unless the tus
   * server reported the upload finished, which keeps it claimable for `uploadExpiresIn` from its last byte.
   */
  readonly expiresAt: Date;
}

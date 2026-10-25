/**
 * Stackra file contract:
 * Purpose: the in-memory `Uploader` for tests and `uploader: "memory"`: every upload succeeds at once with a fresh
 *          token, and is recorded for the test to read (`uploads`).
 * Boundary: no network and no service; a token it mints claims nothing on a real server. Isomorphic, so it ships from
 *           `.` and a browser test binds it with no setup.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0222 (decision 2); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { mintUploadId } from "#core/functions/mint-upload-id.function";
import { Uploader } from "#core/ports/uploader.port";
import type { Upload } from "#core/values/upload.value";

/** One recorded upload. */
type RecordedUpload = {
  readonly file: Blob;
  readonly bucket: string | null;
  readonly upload: Upload;
};

/**
 * Uploads nowhere and remembers what it was given.
 *
 * @example
 * const uploader = container.get(Uploader) as MemoryUploaderDriver;
 * expect(uploader.uploads.map((entry) => entry.bucket)).toEqual([null]);
 */
export class MemoryUploaderDriver extends Driver(Uploader) {
  /** Every upload, in order. */
  readonly uploads: RecordedUpload[] = [];

  /** Records `file` and returns a fresh token. */
  async upload(file: Blob, bucket: string | null): Promise<Upload> {
    const upload: Upload = { id: mintUploadId() };
    this.uploads.push({ file, bucket, upload });
    return upload;
  }
}

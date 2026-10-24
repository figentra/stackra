/**
 * Stackra file contract:
 * Purpose: the `Uploader` port, the client side of an upload: turns a file into the `Upload` token an action takes.
 *          `useUpload` resolves it; config `media.uploader` picks the driver (`http` in an app, `memory` in tests).
 * Boundary: an abstract class that is its own token, keyed `media.Uploader`. In `core`, not `contracts`, because it
 *           speaks `Upload`, a core value (the precedent is `SecretStore` in @stackra/config). A driver never sends the
 *           bytes through a service: it asks for a signed URL and puts them to the store.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2); ADR 0142 (drivers behind a port); ADR 0294 (decisions 4 and 16).
 */
import { Port } from "@stackra/contracts";

import type { Upload } from "#core/values/upload.value";

/**
 * Uploads one file.
 *
 * @example
 * const upload = await container.get(Uploader).upload(file, "catalogue.product_images");
 */
export abstract class Uploader extends Port {
  /** Type-only port key, so `DriverName<Uploader>` narrows to this port's drivers. */
  declare readonly "~key": "media.Uploader";

  /**
   * Uploads `file` into bucket `bucket` (a bucket key), or into the member's only bucket when `null`.
   *
   * @throws UploadFailedError when the service refuses the upload or the store refuses the bytes.
   */
  abstract upload(file: Blob, bucket: string | null): Promise<Upload>;
}

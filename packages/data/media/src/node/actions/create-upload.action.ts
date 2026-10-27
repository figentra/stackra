/**
 * Stackra file contract:
 * Purpose: `media.upload.create@1` (`POST /uploads`): a signed upload of one file into a registered bucket, for the
 *          `http` uploader (`useUpload`) to put the bytes to.
 * Boundary: the bytes never pass through the service (ADR 0222 decision 2). Only buckets gen registered are reachable;
 *           `bucket: null` takes the member's only bucket. The bucket's type and size rules are checked here and again
 *           at claim, against what the store received. A user or an agent may call it; the permission is derived from
 *           the key (`media.upload.create`).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0098 (actions are the unit); ADR 0222 (decision 2).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import { bucketByKey } from "#core/functions/bucket-by-key.function";
import type { MediaLibrary } from "#core/services/media-library.service";
import type { CreateUploadInput } from "#node/schemas/create-upload-input.schema";
import { CreateUploadOutput } from "#node/schemas/create-upload-output.schema";

/** Signs one upload. */
export class CreateUploadAction extends Action({
  key: "upload.create",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  /** The media library that signs it. */
  private readonly media: MediaLibrary;

  /**
   * @param media - the media library that signs it.
   */
  constructor(media: MediaLibrary) {
    super();
    this.media = media;
  }

  /**
   * Signs the upload.
   *
   * @throws NotFoundError when no registered bucket has the key, or `bucket` is `null` and the member has none or
   *         several.
   * @throws UploadRejectedError when the bucket does not take the media type or the size.
   */
  async handle(input: CreateUploadInput): Promise<CreateUploadOutput> {
    const bucket = bucketByKey(input.bucket);
    if (bucket === undefined) throw NotFoundError.create();
    const pending = await this.media.createUpload(bucket, {
      mediaType: input.mediaType,
      size: input.size,
    });
    return CreateUploadOutput.create({
      upload: pending.upload,
      url: pending.url,
      method: pending.method,
      headers: { ...pending.headers },
      expiresAt: pending.expiresAt,
    });
  }
}

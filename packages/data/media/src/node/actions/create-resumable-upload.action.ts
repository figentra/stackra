/**
 * Stackra file contract:
 * Purpose: `media.upload.create_resumable@1` (`POST /uploads/create-resumable`): a resumable tus upload of one file
 *          into a registered bucket, for the `tus` uploader to send the bytes to the tus server in chunks.
 * Boundary: the bytes never pass through the service (ADR 0222 decision 2): they go to the tus server, which starts the
 *           upload only once its pre-create hook (`TusHookController`) admits it. Only buckets gen registered are
 *           reachable; `bucket: null` takes the member's only bucket. The bucket's type and size rules are checked
 *           here, the size again when the tus server starts it and at claim. A user or an agent may call it; the
 *           permission is derived from the key (`media.upload.create_resumable`).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0098 (actions are the unit); ADR 0222 (decision 2: tus
 *                     uploads).
 */
import { Action, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import { bucketByKey } from "#core/functions/bucket-by-key.function";
import type { MediaLibrary } from "#core/services/media-library.service";
import type { CreateUploadInput } from "#node/schemas/create-upload-input.schema";
import { CreateResumableUploadOutput } from "#node/schemas/create-resumable-upload-output.schema";

/** Opens one resumable upload. */
export class CreateResumableUploadAction extends Action({
  key: "upload.create_resumable",
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Optional,
}) {
  /** The media library that records it. */
  private readonly media: MediaLibrary;

  /**
   * @param media - the media library that records it.
   */
  constructor(media: MediaLibrary) {
    super();
    this.media = media;
  }

  /**
   * Records the upload and answers where and how to start it.
   *
   * @throws NotFoundError when no registered bucket has the key, or `bucket` is `null` and the member has none or
   *         several.
   * @throws UploadRejectedError when the bucket does not take the media type or the size.
   */
  async handle(input: CreateUploadInput): Promise<CreateResumableUploadOutput> {
    const bucket = bucketByKey(input.bucket);
    if (bucket === undefined) throw NotFoundError.create();
    const resumable = await this.media.createResumableUpload(bucket, {
      mediaType: input.mediaType,
      size: input.size,
    });
    return CreateResumableUploadOutput.create({
      upload: resumable.upload,
      url: resumable.url,
      headers: { ...resumable.headers },
      expiresAt: resumable.expiresAt,
    });
  }
}

/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateUploadAction` (`media.upload.create@1`): it is declared for users and agents, signs an
 *          upload into a registered bucket or the member's only one, and refuses an unknown bucket and a file its
 *          bucket does not take.
 * Boundary: test only; `handle` is called on an instance over the memory `FileSystem` disk (the pipeline is
 *           @stackra/actions'); the bucket key is read from the record `MediaLibrary` writes beside the upload. The
 *           process-wide bucket registry is cleared after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098; ADR 0222 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind, Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { Bucket } from "#core/bases/bucket.base";
import { BUCKET_REGISTRY } from "#core/constants/bucket-registry.constant";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { registerBuckets } from "#core/functions/register-buckets.function";
import { MediaLibrary } from "#core/services/media-library.service";
import { CreateUploadAction } from "#node/actions/create-upload.action";
import { CreateUploadInput } from "#node/schemas/create-upload-input.schema";
import { CreateUploadOutput } from "#node/schemas/create-upload-output.schema";

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

class ProductImagesBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 5_000_000,
  accept: [MediaType.Png, MediaType.Jpeg],
}) {}

class AvatarsBucket extends Bucket({
  visibility: BucketVisibility.Public,
  maxBytes: 1_000_000,
  accept: [MediaType.Webp],
}) {}

/** The memory disk of the last `action()`. */
let disk = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), new FixedClock());

/** The action over a fresh memory `FileSystem` disk. */
function action(): CreateUploadAction {
  const clock = new FixedClock();
  disk = new MemoryFileSystemDriver(buildConfig(FilesystemConfig), clock);
  return new CreateUploadAction(new MediaLibrary(disk, buildConfig(MediaConfig), clock));
}

/** The bucket key `MediaLibrary` recorded beside the upload. */
async function recordedBucket(output: CreateUploadOutput): Promise<string> {
  const record = await disk.read(`uploads/${output.upload.id}.json`);
  return (JSON.parse(new TextDecoder().decode(record)) as { bucket: string }).bucket;
}

/** The input of one call. */
const input = (bucket: string | null, mediaType: MediaType = MediaType.Png) =>
  CreateUploadInput.create({ bucket, mediaType, size: 1024 });

afterEach(() => {
  BUCKET_REGISTRY.clear();
});

describe("CreateUploadAction", () => {
  it("is the upload.create action of users and agents", () => {
    expect(kindOf(CreateUploadAction)).toMatchObject({
      kind: "action",
      options: { key: "upload.create", actors: [ActorKind.User, ActorKind.Agent] },
    });
  });

  it("signs an upload into the named bucket", async () => {
    registerBuckets([
      { type: ProductImagesBucket, key: "catalogue.product_images" },
      { type: AvatarsBucket, key: "identity.avatars" },
    ]);
    const output = await action().handle(input("catalogue.product_images"));
    expect(output).toBeInstanceOf(CreateUploadOutput);
    expect(output.upload.id).toMatch(/^upl_/);
    expect(output.method).toBe("PUT");
    expect(output.headers).toEqual({ "content-type": "image/png" });
    expect(await recordedBucket(output)).toBe("catalogue.product_images");
    expect(output.expiresAt).toEqual(new Date("2026-10-24T10:00:00.000Z"));
  });

  it("takes the member's only bucket when none is named", async () => {
    registerBuckets([{ type: ProductImagesBucket, key: "catalogue.product_images" }]);
    const output = await action().handle(input(null));
    expect(await recordedBucket(output)).toBe("catalogue.product_images");
  });

  it("refuses an unknown bucket, and null among several", async () => {
    registerBuckets([
      { type: ProductImagesBucket, key: "catalogue.product_images" },
      { type: AvatarsBucket, key: "identity.avatars" },
    ]);
    await expect(action().handle(input("billing.invoices"))).rejects.toBeInstanceOf(NotFoundError);
    await expect(action().handle(input(null))).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses a media type the bucket does not take", async () => {
    registerBuckets([{ type: AvatarsBucket, key: "identity.avatars" }]);
    await expect(action().handle(input("identity.avatars", MediaType.Png))).rejects.toBeInstanceOf(
      UploadRejectedError,
    );
  });
});

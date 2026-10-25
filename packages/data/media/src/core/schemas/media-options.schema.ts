/**
 * Stackra file contract:
 * Purpose: `MediaOptions`, the shape of `MediaConfig`: which disk the server stores media on, which uploader the client
 *          uses, how long an upload stays valid and where the HTTP uploader asks for a signed URL.
 * Boundary: a shape class; it registers this package's own schema (`MEDIA_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(MediaConfig)` validates with no generated file. Deploy-time values only; no
 *           credential. The bucket, region and public base URL are `FilesystemConfig`'s: media shares the store's
 *           bucket per region and environment (ADR 0222 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0222 (decisions 1 and 2).
 */
import "#core/types/media-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import type { MediaDisk } from "#contracts/ports/media-disk.port";
import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";
import type { Uploader } from "#core/ports/uploader.port";

/**
 * The media settings.
 *
 * @example
 * export class MediaConfig extends BaseMediaConfig {
 *   override disk: DriverName<MediaDisk> = "s3";
 * }
 */
export class MediaOptions extends Schema {
  /** The server's store; names are the driver file prefixes. `memory` keeps nothing and is safe everywhere. */
  disk: DriverName<MediaDisk> = "memory";

  /** The client's uploader: `http` in an app, `memory` in tests. */
  uploader: DriverName<Uploader> = "memory";

  /** How long a signed upload URL, and the token it was issued with, stay valid; at most seven days. */
  uploadExpiresIn: Duration = Duration.hours(1);

  /** Where the `http` uploader asks for a signed URL: the `upload.create` endpoint of the media module. */
  uploadEndpoint = "/api/uploads";
}

registerSchemas([[MediaOptions, MEDIA_CONFIG_SCHEMA]]);

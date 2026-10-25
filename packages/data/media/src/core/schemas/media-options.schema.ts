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

import type { FileScanner } from "#contracts/ports/file-scanner.port";
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

  /** The malware scanner: `guard_duty` where GuardDuty runs in the region, `clamav` elsewhere, `memory` in tests. */
  scanner: DriverName<FileScanner> = "memory";

  /** The clamd daemon the `clamav` scanner streams to, and the largest file it sends (clamd's `StreamMaxLength`). */
  clamav: {
    /** The daemon's host. */
    host: string;
    /** The daemon's TCP port. */
    port: number;
    /** The largest file streamed, in bytes; a larger one is `failed`. */
    maxBytes: number;
  } = { host: "127.0.0.1", port: 3310, maxBytes: 26_214_400 };
}

registerSchemas([[MediaOptions, MEDIA_CONFIG_SCHEMA]]);

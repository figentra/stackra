/**
 * Stackra file contract:
 * Purpose: `FilesystemOptions`, the shape of `FilesystemConfig`: which disk runs, where the local disk keeps its files,
 *          the base URL public files are served from and the S3/R2 bucket.
 * Boundary: a shape class; it registers this package's own schema (`FILESYSTEM_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(FilesystemConfig)` validates with no generated file. `s3` is a nested object
 *           a host override replaces whole, merging the base value explicitly. Deploy-time values only; no credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0234 (decision 7).
 */
import "#core/types/file-system-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { FileSystem } from "#contracts/ports/file-system.port";
import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";

/**
 * The disk settings.
 *
 * @example
 * export class FilesystemConfig extends BaseFilesystemConfig {
 *   override disk: DriverName<FileSystem> = "s3";
 *   override s3 = { ...this.s3, bucket: "acme-files", region: "auto", endpoint: "https://acct.r2.cloudflarestorage.com" };
 * }
 */
export class FilesystemOptions extends Schema {
  /** Which driver runs; names are the driver file prefixes. `memory` is safe everywhere and keeps nothing. */
  disk: DriverName<FileSystem> = "memory";

  /** The local disk's folder, resolved against the working directory; the Electron disk's, under `userData`. */
  root = "storage";

  /** The base URL public files are served from (a CDN or the static route); `null` when the disk is private. */
  url: string | null = null;

  /** The S3-compatible bucket of the `s3` disk: AWS S3, Cloudflare R2 or MinIO. */
  s3: {
    /** The bucket name; required by the `s3` disk. */
    bucket: string;
    /** The signing region; `auto` for R2. */
    region: string;
    /** The endpoint of a non-AWS store (R2, MinIO); `null` for AWS. */
    endpoint: string | null;
    /** Path-style addressing (`<endpoint>/<bucket>/<key>`), which MinIO needs. */
    forcePathStyle: boolean;
  } = { bucket: "", region: "us-east-1", endpoint: null, forcePathStyle: false };
}

registerSchemas([[FilesystemOptions, FILESYSTEM_CONFIG_SCHEMA]]);

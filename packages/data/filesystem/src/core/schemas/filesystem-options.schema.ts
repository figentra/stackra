/**
 * Stackra file contract:
 * Purpose: `FilesystemOptions`, the shape of `FilesystemConfig`: which disk runs, where the local disk keeps its files,
 *          the base URL public files are served from, the S3/R2 bucket and the
 *          GCS bucket.
 *          `health` tunes `FilesystemHealthIndicatorDriver`, the `/readyz` probe.
 * Boundary: a shape class; it registers this package's own schema (`FILESYSTEM_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(FilesystemConfig)` validates with no generated file. `s3` and `gcs` are nested
 *           objects a host override replaces whole, merging the base value explicitly. Deploy-time values only; no credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0234 (decision 7).
 */
import "#core/types/file-system-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

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
  /** The S3-compatible bucket of the `s3` disk: AWS S3, Cloudflare R2 or MinIO. */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(FILESYSTEM_CONFIG_SCHEMA.shape.s3)
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

  /** The Google Cloud Storage bucket of the `gcs` disk (the in-country GCP environments, ADR 0354). */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(FILESYSTEM_CONFIG_SCHEMA.shape.gcs)
  gcs: {
    /** The bucket name; required by the `gcs` disk. */
    bucket: string;
    /** The project the client bills to; `null` reads it from the environment's credentials. */
    projectId: string | null;
  } = { bucket: "", projectId: null };

  /** How `FilesystemHealthIndicatorDriver` probes the disk for `/readyz`. */
  // reason: a nested option a host override replaces whole; the shipped config schema holds its rules
  @Field(FILESYSTEM_CONFIG_SCHEMA.shape.health)
  health: {
    /** How long the probe may take. */
    timeout: Duration;
    /** Whether a failed probe fails readiness; `false` reports `degraded` instead. */
    critical: boolean;
    /** The path the probe asks the disk about; it need not exist. */
    path: string;
  } = { timeout: Duration.seconds(2), critical: true, path: ".health" };

  /** Which driver runs; names are the driver file prefixes. `memory` is safe everywhere and keeps nothing. */
  disk: DriverName<FileSystem> = "memory";

  /**
   * The local disk's folder, resolved against the working directory; the Electron disk's, under `userData`; the Expo
   * disk's, under the app's documents folder.
   */
  root = "storage";

  /** The base URL public files are served from (a CDN or the static route); `null` when the disk is private. */
  url: string | null = null;
}

registerSchemas([[FilesystemOptions, FILESYSTEM_CONFIG_SCHEMA]]);

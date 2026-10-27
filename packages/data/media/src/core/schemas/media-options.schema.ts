/**
 * Stackra file contract:
 * Purpose: `MediaOptions`, the shape of `MediaConfig`: which uploader the client uses, how long an upload stays valid, where the HTTP uploader asks for a signed URL, the in-region OCR
 *          service and the C2PA signing slot.
 * Boundary: a shape class; it registers this package's own schema (`MEDIA_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(MediaConfig)` validates with no generated file. Deploy-time values only; the one
 *           credential, the C2PA certificate chain and key, is two `@Secret` names resolved blind from the secret store
 *           (ADR 0173), empty until the certificate exists. The disk, bucket, region and public base URL are
 *           `FilesystemConfig`'s: media stores on the one `FileSystem` disk per region and environment (ADR 0222
 *           decision 1; ADR 0465, which dropped the `disk` field here).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0222 (decisions 1 and 2); ADR 0173;
 *                     R3-SO-13; STA-789.
 */
import "#core/types/media-driver-names.type";

import { Secret } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { FileScanner } from "#contracts/ports/file-scanner.port";
import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";
import type { Uploader } from "#core/ports/uploader.port";
import type { C2paAlgorithm } from "#core/types/c2pa-algorithm.type";

/**
 * The media settings.
 *
 * @example
 * export class MediaConfig extends BaseMediaConfig {
 *   override scanner: DriverName<FileScanner> = "clamav";
 * }
 */
export class MediaOptions extends Schema {
  /** The C2PA signing certificate chain (PEM, leaf first). Empty until the certificate is issued (certification pending). */
  @Secret("MEDIA_C2PA_SIGNING_CERTIFICATE")
  c2paSigningCertificate = "";

  /** The private key of the C2PA signing certificate (PEM, PKCS#8). Empty until the certificate is issued. */
  @Secret("MEDIA_C2PA_SIGNING_KEY")
  c2paSigningKey = "";

  /** The clamd daemon the `clamav` scanner streams to, and the largest file it sends (clamd's `StreamMaxLength`). */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(MEDIA_CONFIG_SCHEMA.shape.clamav)
  clamav: {
    /** The daemon's host. */
    host: string;
    /** The daemon's TCP port. */
    port: number;
    /** The largest file streamed, in bytes; a larger one is `failed`. */
    maxBytes: number;
  } = { host: "127.0.0.1", port: 3310, maxBytes: 26_214_400 };

  /**
   * The self-hosted PaddleOCR service the `paddle_ocr` text extractor posts to. Runway sets `endpoint` per region to
   * the service in that region, so a scan never leaves it (R3-SO-13). `languages` are the ones the deployed
   * recognition model reads; a hint outside them is refused.
   */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(MEDIA_CONFIG_SCHEMA.shape.ocr)
  ocr: {
    /** The service's `POST /ocr` URL. */
    endpoint: string;
    /** The BCP 47 languages the deployed model reads. */
    languages: string[];
    /** The largest file sent, in bytes; a larger one is refused. */
    maxBytes: number;
    /** How long one request may take, in milliseconds. */
    timeoutMs: number;
  } = {
    endpoint: "http://127.0.0.1:8080/ocr",
    languages: ["ar", "en"],
    maxBytes: 20_971_520,
    timeoutMs: 60_000,
  };

  /**
   * How the `c2pa` content-credentials driver signs: the COSE algorithm of the key, an RFC 3161 time-stamp authority
   * (empty for none) and the image types it signs.
   */
  // reason: a nested driver option a host override replaces whole; the shipped config schema holds its rules
  @Field(MEDIA_CONFIG_SCHEMA.shape.c2pa)
  c2pa: {
    /** The signing algorithm of `c2paSigningKey`. */
    algorithm: C2paAlgorithm;
    /** The time-stamp authority URL; empty signs without a trusted time. */
    timestampUrl: string;
    /** The image media types the driver signs and reads. */
    formats: string[];
  } = { algorithm: "es256", timestampUrl: "", formats: ["image/jpeg", "image/png", "image/webp"] };

  /** The client's uploader: `http` in an app, `memory` in tests. */
  uploader: DriverName<Uploader> = "memory";

  /** How long a signed upload URL, and the token it was issued with, stay valid; at most seven days. */
  uploadExpiresIn: Duration = Duration.hours(1);

  /** Where the `http` uploader asks for a signed URL: the `upload.create` endpoint of the media module. */
  uploadEndpoint = "/api/uploads";

  /** The malware scanner: `guard_duty` where GuardDuty runs in the region, `clamav` elsewhere, `memory` in tests. */
  scanner: DriverName<FileScanner> = "memory";
}

registerSchemas([[MediaOptions, MEDIA_CONFIG_SCHEMA]]);

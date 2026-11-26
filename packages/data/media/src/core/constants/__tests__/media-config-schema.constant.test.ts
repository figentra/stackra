/**
 * Stackra file contract:
 * Purpose: unit tests of `MEDIA_CONFIG_SCHEMA` (`MediaConfig$`): full defaults from `{}` with no `disk` (ADR 0465),
 *          only this package's driver names (the tus uploader included), a signed and a resumable upload lifetime above
 *          zero and at most seven days (either duration form, stored canonical), the tus server settings, and the OCR
 *          and C2PA settings.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";

describe("MEDIA_CONFIG_SCHEMA", () => {
  it("gives the full defaults", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({})).toEqual({
      uploader: "memory",
      uploadExpiresIn: "PT1H",
      resumableUploadExpiresIn: "P1D",
      uploadEndpoint: "/api/uploads",
      resumableUploadEndpoint: "/api/uploads/create-resumable",
      tus: {
        endpoint: "/files/",
        chunkBytes: 8_388_608,
        retryDelaysMs: [0, 1000, 3000, 5000, 10_000],
      },
      tusHookSecret: "",
      scanner: "memory",
      clamav: { host: "127.0.0.1", port: 3310, maxBytes: 26_214_400 },
      ocr: {
        endpoint: "http://127.0.0.1:8080/ocr",
        languages: ["ar", "en"],
        maxBytes: 20_971_520,
        timeoutMs: 60_000,
      },
      c2pa: {
        algorithm: "es256",
        timestampUrl: "",
        formats: ["image/jpeg", "image/png", "image/webp"],
      },
      c2paSigningCertificate: "",
      c2paSigningKey: "",
    });
  });

  it("takes only this package's drivers", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ uploader: "http", scanner: "guard_duty" })).toMatchObject({
      uploader: "http",
      scanner: "guard_duty",
    });
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ scanner: "virustotal" }).success).toBe(false);
    expect(MEDIA_CONFIG_SCHEMA.parse({ uploader: "tus" }).uploader).toBe("tus");
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploader: "ftp" }).success).toBe(false);
  });

  it("takes a tus server with whole chunks and bounded retry pauses", () => {
    expect(
      MEDIA_CONFIG_SCHEMA.parse({ tus: { endpoint: "https://uploads.test/files/" } }).tus,
    ).toEqual({
      endpoint: "https://uploads.test/files/",
      chunkBytes: 8_388_608,
      retryDelaysMs: [0, 1000, 3000, 5000, 10_000],
    });
    expect(MEDIA_CONFIG_SCHEMA.parse({ tus: { retryDelaysMs: [] } }).tus.retryDelaysMs).toEqual([]);
    for (const tus of [
      { endpoint: "" },
      { chunkBytes: 0 },
      { chunkBytes: 1.5 },
      { retryDelaysMs: [-1] },
      { retryDelaysMs: [300_001] },
      { retryDelaysMs: Array.from({ length: 21 }, () => 0) },
    ])
      expect(MEDIA_CONFIG_SCHEMA.safeParse({ tus }).success).toBe(false);
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ resumableUploadEndpoint: "" }).success).toBe(false);
  });

  it("drops a leftover disk value: the store is filesystem.disk (ADR 0465)", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ disk: "s3" })).not.toHaveProperty("disk");
  });

  it("takes an upload lifetime above zero and up to seven days", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ uploadExpiresIn: Duration.days(7) }).uploadExpiresIn).toBe(
      "P7D",
    );
    expect(MEDIA_CONFIG_SCHEMA.parse({ uploadExpiresIn: "1h" }).uploadExpiresIn).toBe("PT1H");
    for (const lifetime of ["PT0S", "P8D", "8d", "an hour", 3600])
      expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploadExpiresIn: lifetime }).success).toBe(false);
  });

  it("takes a resumable upload lifetime of its own, above zero and up to seven days", () => {
    const parsed = MEDIA_CONFIG_SCHEMA.parse({ resumableUploadExpiresIn: "3d" });
    expect(parsed.resumableUploadExpiresIn).toBe("P3D");
    expect(parsed.uploadExpiresIn).toBe("PT1H");
    for (const lifetime of ["PT0S", "P8D", "a day", 86_400])
      expect(MEDIA_CONFIG_SCHEMA.safeParse({ resumableUploadExpiresIn: lifetime }).success).toBe(
        false,
      );
  });

  it("refuses an empty endpoint", () => {
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploadEndpoint: "" }).success).toBe(false);
  });

  it("takes an OCR service with at least one language", () => {
    expect(
      MEDIA_CONFIG_SCHEMA.parse({ ocr: { endpoint: "http://ocr.ksa.internal/ocr" } }).ocr,
    ).toMatchObject({ endpoint: "http://ocr.ksa.internal/ocr", languages: ["ar", "en"] });
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ ocr: { endpoint: "not a url" } }).success).toBe(false);
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ ocr: { languages: [] } }).success).toBe(false);
  });

  it("takes a C2PA algorithm it knows and image formats only", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ c2pa: { algorithm: "ps256" } }).c2pa.algorithm).toBe(
      "ps256",
    );
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ c2pa: { algorithm: "rs256" } }).success).toBe(false);
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ c2pa: { formats: ["application/pdf"] } }).success).toBe(
      false,
    );
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ c2pa: { timestampUrl: "nope" } }).success).toBe(false);
  });
});

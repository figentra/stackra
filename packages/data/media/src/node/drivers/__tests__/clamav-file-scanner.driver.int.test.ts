/**
 * Stackra file contract:
 * Purpose: integration tests of the ADR 0222 scan gate on a real clamd: `ClamavFileScannerDriver` streams to the
 *          daemon, which finds the EICAR test file inside a PDF; `MediaLibrary.claim` over it places a clean upload,
 *          and deletes and refuses an infected one before it reaches a served path; `store` keeps nothing infected;
 *          `temporaryUrl` refuses an infected file recorded before the gate; a stopped daemon keeps the upload.
 * Boundary: test only; clamd runs in a Testcontainers `clamav/clamav` container with its bundled signatures, so
 *           Docker and the image are needed; the memory `FileSystem` disk receives the bytes as a browser's signed
 *           `PUT` would.
 * Runtime: node (vitest, int tier)
 * Governing contract: ADR 0182 (test tiers); ADR 0222 (an unscanned file is never served); ADR 0354 (ClamAV where
 *                     GuardDuty is not offered); STA-669.
 */
import { buildConfig } from "@stackra/config";
import { Clock, Duration } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

import { MediaConfig } from "#config/media.config";
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { Bucket } from "#core/bases/bucket.base";
import { BucketVisibility } from "#core/enums/bucket-visibility.enum";
import { MediaType } from "#core/enums/media-type.enum";
import { FileBlockedError } from "#core/errors/file-blocked.error";
import { UploadRejectedError } from "#core/errors/upload-rejected.error";
import { MediaLibrary } from "#core/services/media-library.service";
import { ClamavFileScannerDriver } from "#node/drivers/clamav-file-scanner.driver";

/** The clamd image, pinned; it ships its signature database. */
const IMAGE = "clamav/clamav:1.4";

/** The EICAR anti-malware test string, which clamd reports as `Eicar-Signature` wherever a parser finds it. */
const EICAR = String.raw`X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`;

/** A PDF whose one stream is the EICAR string: a real PDF head (so the content check passes) carrying the test threat. */
const INFECTED_PDF = new TextEncoder().encode(
  `%PDF-1.4\n1 0 obj\n<< /Length ${EICAR.length} >>\nstream\n${EICAR}\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`,
);

/** A clean PDF. */
const CLEAN_PDF = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< >>\nendobj\n%%EOF\n");

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

class InvoicesBucket extends Bucket({
  visibility: BucketVisibility.Private,
  maxBytes: 10_000,
  accept: [MediaType.Pdf],
}) {}

let clamd: StartedTestContainer;

/** A library over a memory disk, scanned by the clamd at `port` (the container's by default). */
function setup(port = clamd.getMappedPort(3310)) {
  const clock = new FixedClock();
  const disk = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    clock,
  );
  const config = buildConfig(MediaConfig, {
    values: { scanner: "clamav", clamav: { host: clamd.getHost(), port, maxBytes: 26_214_400 } },
  });
  const scanner = new ClamavFileScannerDriver(config);
  return { disk, scanner, media: new MediaLibrary(disk, config, clock, scanner) };
}

/** An upload into the invoices bucket whose bytes have arrived. */
async function uploaded(disk: MemoryFileSystemDriver, media: MediaLibrary, bytes: Uint8Array) {
  const pending = await media.createUpload(InvoicesBucket, {
    mediaType: MediaType.Pdf,
    size: bytes.byteLength,
  });
  expect(await disk.receive(pending.url, pending.headers, bytes)).toBe(200);
  return pending;
}

beforeAll(async () => {
  clamd = await new GenericContainer(IMAGE)
    .withExposedPorts(3310)
    .withWaitStrategy(Wait.forLogMessage("socket found, clamd started"))
    .withStartupTimeout(240_000)
    .start();
}, 300_000);

afterAll(async () => {
  await clamd?.stop();
});

describe("the scan gate on clamd (ADR 0222)", () => {
  it("clamd finds the EICAR stream in a PDF and passes a clean one", async () => {
    const { scanner } = setup();
    expect(await scanner.scan("uploads/x", async () => INFECTED_PDF)).toEqual({
      verdict: ScanVerdict.Infected,
      threats: ["Eicar-Signature"],
    });
    expect(await scanner.scan("uploads/y", async () => CLEAN_PDF)).toEqual({
      verdict: ScanVerdict.Clean,
      threats: [],
    });
  });

  it("claims a clean upload into the bucket", async () => {
    const { disk, media } = setup();
    const pending = await uploaded(disk, media, CLEAN_PDF);

    const file = await media.claim(pending.upload, InvoicesBucket);

    expect(file).toMatchObject({
      path: `private/invoices/${pending.upload.id}.pdf`,
      scan: ScanVerdict.Clean,
    });
    expect(await disk.read(file.path)).toEqual(CLEAN_PDF);
    expect(await media.temporaryUrl(file, Duration.minutes(5))).toContain(file.path);
  });

  it("deletes and refuses an infected upload before it reaches a served path", async () => {
    const { disk, media } = setup();
    const pending = await uploaded(disk, media, INFECTED_PDF);

    const refused = media.claim(pending.upload, InvoicesBucket);

    await expect(refused).rejects.toBeInstanceOf(UploadRejectedError);
    await expect(refused).rejects.toMatchObject({ reason: "malware" });
    expect(await disk.list("")).toEqual([]);
  });

  it("keeps nothing of infected bytes the server stores", async () => {
    const { disk, media } = setup();

    await expect(media.store(InvoicesBucket, INFECTED_PDF, MediaType.Pdf)).rejects.toMatchObject({
      reason: "malware",
    });
    expect(await disk.list("")).toEqual([]);
  });

  it("refuses to link an infected file recorded before the gate", async () => {
    const { disk, media } = setup();
    const path = "private/invoices/upl_01jd8x0000000000000000000a.pdf";
    await disk.write(path, INFECTED_PDF, { contentType: "application/pdf" });

    const refused = media.temporaryUrl(
      { id: "upl_01jd8x0000000000000000000a" as never, path },
      Duration.minutes(5),
    );

    await expect(refused).rejects.toBeInstanceOf(FileBlockedError);
    await expect(refused).rejects.toMatchObject({ reason: "malware" });
  });

  it("keeps the upload unplaced when clamd cannot be reached", async () => {
    const { disk, media } = setup(1);
    const pending = await uploaded(disk, media, CLEAN_PDF);

    await expect(media.claim(pending.upload, InvoicesBucket)).rejects.toThrow();
    expect(await disk.list("private/")).toEqual([]);
    expect(await disk.exists(`uploads/${pending.upload.id}`)).toBe(true);
  });
});

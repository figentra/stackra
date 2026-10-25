/**
 * Stackra file contract:
 * Purpose: unit tests of `RksvDriver`: the machine-readable receipt (buckets, encrypted counter, serial, link to the
 *          previous receipt), the compact JWS and QR, cancellations, the running turnover, the refusals, the no-op
 *          submission and the data collection export.
 * Boundary: test only; the signer, cipher and credentials are fakes and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import { RksvDriver } from "#core/drivers/rksv.driver";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { fromBase64 } from "#core/functions/from-base64.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toBase64Url } from "#core/functions/to-base64-url.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";
import { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

const OPTIONS = {
  providerId: "P1",
  rateBuckets: { "20": "normal", "10": "reduced1" },
  timeZone: "UTC",
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const credentials = () =>
  TillCredentialsFake.with([
    {
      unitId: "till_1",
      stage: "production",
      requestId: null,
      token: null,
      secret: null,
      certificate: "CERT",
      certificateSerial: "SERIAL1",
    },
  ]);

describe("RksvDriver#seal", () => {
  it("signs the first receipt as a compact JWS", async () => {
    const signer = new FiscalSignerFake();
    const sealed = await new RksvDriver(signer, new TurnoverCipherFake(), credentials()).seal(
      fiscalDocument(),
      context,
    );
    const link = toBase64((await sha256("till_1")).subarray(0, 8));
    const counter = toBase64("till_1:INV-0001:3500");
    const receipt = `_R1-P1_till_1_INV-0001_2026-03-01T09:30:00_24,00_11,00_0,00_0,00_0,00_${counter}_SERIAL1_${link}`;
    const [request] = signer.calls("sign") as SignatureRequest[];
    const signingInput = `${toBase64Url('{"alg":"ES256"}')}.${toBase64Url(receipt)}`;
    expect([request?.format, request?.payload]).toEqual([SignatureFormat.Jws, signingInput]);
    expect(sealed.payload).toBe(`${signingInput}.${sealed.signature}`);
    expect(sealed.qr).toBe(`${receipt}_${toBase64(fromBase64(sealed.signature ?? ""))}`);
    expect([sealed.marks, sealed.status]).toEqual([
      { turnover: "3500" },
      FiscalRecordStatus.Accepted,
    ]);
  });

  it("links to the previous receipt, keeps the running turnover and marks a cancellation", async () => {
    const previous = fiscalRecord({ payload: "previous.jws", marks: { turnover: "10000" } });
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: { number: "INV-0000", issuedAt: new Date(0), reason: "returned", reference: null },
    });
    const sealed = await new RksvDriver(
      new FiscalSignerFake(),
      new TurnoverCipherFake(),
      credentials(),
    ).seal(note, {
      ...context,
      previous,
      sequence: 2,
    });
    const link = toBase64((await sha256("previous.jws")).subarray(0, 8));
    expect(sealed.qr).toContain(`_-24,00_-11,00_0,00_0,00_0,00_U1RP_SERIAL1_${link}_`);
    expect(sealed.marks.turnover).toBe("6500");
  });

  it("refuses a till without a certificate serial and a rate without a bucket", async () => {
    await expect(
      new RksvDriver(
        new FiscalSignerFake(),
        new TurnoverCipherFake(),
        TillCredentialsFake.with([]),
      ).seal(fiscalDocument(), context),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
    await expect(
      new RksvDriver(new FiscalSignerFake(), new TurnoverCipherFake(), credentials()).seal(
        fiscalDocument(),
        {
          ...context,
          options: { ...OPTIONS, rateBuckets: {} },
        },
      ),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
  });
});

describe("RksvDriver#submit and #exportJournal", () => {
  it("accepts without a call and exports the certificate and every JWS", async () => {
    const driver = new RksvDriver(new FiscalSignerFake(), new TurnoverCipherFake(), credentials());
    expect((await driver.submit(fiscalRecord(), context)).status).toBe(FiscalRecordStatus.Accepted);
    const file = await driver.exportJournal([fiscalRecord({ payload: "a.b.c" })], context);
    expect(JSON.parse(file.content)).toEqual({
      "Belege-Gruppe": [
        { Signaturzertifikat: "CERT", Zertifizierungsstellen: [], "Belege-kompakt": ["a.b.c"] },
      ],
    });
  });
});

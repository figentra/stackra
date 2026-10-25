/**
 * Stackra file contract:
 * Purpose: `RksvDriver`, the `rksv` till rule (a register security regulation): the machine-readable receipt (provider
 *          prefix, till, receipt number, local time, gross per amount bucket, the encrypted turnover counter, the
 *          certificate serial and a link to the previous receipt), signed as a compact JWS by the till's signature
 *          unit; the QR is the receipt plus its signature.
 * Boundary: a driver of `FiscalDriver`, key `rksv`. Offline: the chain is the obligation and nothing is submitted.
 *           The turnover key and the signing key stay with the host (`TurnoverCipher`, `FiscalSigner`); the serial
 *           comes from `TillCredentials`. The running turnover is kept in the record's `turnover` mark. Buckets,
 *           provider id and time zone are pack options; the algorithm id `R1` and the cancellation marker are the
 *           format's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Money } from "@stackra/money";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { TurnoverCipher } from "#contracts/ports/turnover-cipher.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { RKSV_OPTIONS } from "#core/constants/rksv-options.constant";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { fromBase64 } from "#core/functions/from-base64.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toBase64Url } from "#core/functions/to-base64-url.function";
import { zonedTime } from "#core/functions/zoned-time.function";

/** The amount buckets in receipt order. */
const BUCKETS = ["normal", "reduced1", "reduced2", "zero", "special"] as const;

/** The encrypted-counter field of a cancellation receipt: base64 of "STO". */
const CANCELLATION = toBase64("STO");

/**
 * Signs receipts on the till's chain through its signature unit.
 *
 * @example
 * new FiscalService([new RksvDriver(signer, cipher, credentials)], packs, journal, clock);
 */
export class RksvDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "rksv";

  /** The till's signature unit. */
  private readonly signer: FiscalSigner;

  /** Encrypts the turnover counter with the till's key. */
  private readonly cipher: TurnoverCipher;

  /** Holds the till's certificate and serial. */
  private readonly credentials: TillCredentials;

  /**
   * @param signer - the till's JWS signer.
   * @param cipher - the till's turnover cipher.
   * @param credentials - the till credential store.
   */
  constructor(signer: FiscalSigner, cipher: TurnoverCipher, credentials: TillCredentials) {
    super();
    this.signer = signer;
    this.cipher = cipher;
    this.credentials = credentials;
  }

  /**
   * Signs the receipt onto the till's chain; a credit note is a cancellation that lowers the counter.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a rate has no bucket.
   * @throws FiscalCredentialMissingError when the till has no certificate serial.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(RKSV_OPTIONS, context.options, this.key);
    const credential = await this.credentials.get(context.unitId);
    if (!credential?.certificateSerial)
      throw FiscalCredentialMissingError.create({ unitId: context.unitId, driver: this.key });
    const cancellation = document.kind === FiscalDocumentKind.CreditNote;
    const signed = (money: Money) =>
      cancellation ? Money.zero(money.currency).minus(money) : money;

    const sums = new Map<string, Money>(
      BUCKETS.map((bucket) => [bucket, Money.zero(document.currency)]),
    );
    for (const line of document.lines) {
      const bucket = options.rateBuckets[line.taxRate];
      if (!bucket)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `rateBuckets: none for ${line.taxRate}`,
        });
      sums.set(
        bucket,
        (sums.get(bucket) ?? Money.zero(document.currency)).plus(line.net.plus(line.tax)),
      );
    }
    const turnover = Number(context.previous?.marks.turnover ?? "0") + signed(document.gross).minor;
    const counter = cancellation
      ? CANCELLATION
      : await this.cipher.encrypt(context.unitId, document.number, turnover);
    const link = toBase64(
      (await sha256(context.previous?.payload ?? context.unitId)).subarray(0, 8),
    );
    const local = zonedTime(document.issuedAt, options.timeZone);
    const receipt = [
      `_R1-${options.providerId}`,
      context.unitId,
      document.number,
      `${local.date}T${local.time}`,
      ...BUCKETS.map((bucket) =>
        signed(sums.get(bucket) ?? Money.zero(document.currency))
          .toDecimal()
          .replace(".", ","),
      ),
      counter,
      credential.certificateSerial,
      link,
    ].join("_");
    const signingInput = `${toBase64Url(JSON.stringify({ alg: "ES256" }))}.${toBase64Url(receipt)}`;
    const signature = await this.signer.sign({
      unitId: context.unitId,
      format: SignatureFormat.Jws,
      payload: signingInput,
      digest: toBase64(await sha256(signingInput)),
    });
    const jws = `${signingInput}.${signature.value}`;
    return {
      payload: jws,
      contentType: "application/jose",
      hash: toBase64(await sha256(jws)),
      signature: signature.value,
      qr: `${receipt}_${toBase64(fromBase64(signature.value))}`,
      marks: { turnover: String(turnover) },
      status: FiscalRecordStatus.Accepted,
    };
  }

  /** Nothing to hand over: the chain is the record. */
  async submit(_record: FiscalRecord, _context: DriverContext): Promise<SubmissionOutcome> {
    return {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
  }

  /** The data collection protocol export: the till's certificate and every compact JWS in order. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    const credential = await this.credentials.get(context.unitId);
    return {
      fileName: `${context.unitId}.dep.json`,
      contentType: "application/json",
      encoding: "utf-8",
      content: JSON.stringify({
        "Belege-Gruppe": [
          {
            Signaturzertifikat: credential?.certificate ?? "",
            Zertifizierungsstellen: [],
            "Belege-kompakt": records.map((record) => record.payload),
          },
        ],
      }),
    };
  }
}

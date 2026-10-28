/**
 * Stackra file contract:
 * Purpose: `EtaDriver`, the `eta` mandate (the Egyptian e-invoicing system): the document JSON with every line's
 *          registered item code, serialized canonically, sealed with CAdES-BES by the issuer's token or cloud seal,
 *          and submitted in a batch of one.
 * Boundary: a driver of `FiscalDriver`, key `eta`. The authority validates after it accepts a submission, so an
 *           accepted document is `submitted` with its UUID as the reference, and `poll` asks the pack's status URL for
 *           the verdict (`valid` or `invalid`). Tax types, the activity code, the
 *           version, the endpoint and the reporting currency are pack options; party and document type letters are
 *           the format's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 8); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Money } from "@stackra/money";
import { z } from "zod";

import type { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { PartyKind } from "#contracts/enums/party-kind.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { ETA_OPTIONS } from "#core/constants/eta-options.constant";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { canonicalEta } from "#core/functions/canonical-eta.function";
import { etaVerdict } from "#core/functions/eta-verdict.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";

/** The format's document type letter per kind. */
const DOCUMENT_TYPES: Readonly<Record<FiscalDocumentKind, string>> = {
  invoice: "I",
  simplified: "I",
  credit_note: "C",
  debit_note: "D",
};

/** The format's party type letter per kind. */
const PARTY_TYPES: Readonly<Record<PartyKind, string>> = {
  business: "B",
  person: "P",
  foreign: "F",
};

/** The submission answer's parts the outcome reads. */
const ANSWER = z
  .object({
    submissionId: z.string().nullish(),
    acceptedDocuments: z.array(z.object({ uuid: z.string(), internalId: z.string() })).nullish(),
    rejectedDocuments: z
      .array(
        z.object({ internalId: z.string(), error: z.object({ message: z.string() }).nullish() }),
      )
      .nullish(),
  })
  .catch({});

/** A decimal amount as the JSON number the format carries. */
const number = (money: Money): number => Number(money.toDecimal());

/** A party in the format's shape. */
const party = (value: FiscalParty) => ({
  address: value.address && {
    branchID: value.address.branchId ?? "0",
    country: value.address.country,
    governate: value.address.region ?? "",
    regionCity: value.address.city,
    street: value.address.street,
    buildingNumber: value.address.buildingNumber ?? "",
    postalCode: value.address.postalCode ?? undefined,
  },
  type: PARTY_TYPES[value.kind],
  id: value.taxId ?? "",
  name: value.name,
});

/**
 * Builds, seals and submits documents for one issuer.
 *
 * @example
 * FiscalService.with([new EtaDriver(signer, transport)], packs, journal, clock);
 */
export class EtaDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "eta";

  /** Seals with the issuer's token or cloud seal. */
  private readonly signer: FiscalSigner;

  /** Reaches the submission endpoint with the issuer's client token. */
  private readonly transport: FiscalTransport;

  /**
   * @param signer - the issuer's CAdES signer.
   * @param transport - the host's HTTP binding.
   */
  constructor(signer: FiscalSigner, transport: FiscalTransport) {
    super();
    this.signer = signer;
    this.transport = transport;
  }

  /**
   * Builds the document, seals its canonical form and returns the signed JSON; works offline.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a line's tax category has no tax type.
   * @throws FiscalDocumentInvalidError when the seller has no tax number or address, there is no buyer, the currency
   *   is not the reporting currency, or a line has no item code.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(ETA_OPTIONS, context.options, this.key);
    const invalid = (field: string) =>
      FiscalDocumentInvalidError.create({ driver: this.key, field });
    if (!document.seller.taxId) throw invalid("seller.taxId");
    if (!document.seller.address) throw invalid("seller.address");
    if (!document.buyer) throw invalid("buyer");
    if (document.currency !== options.reportingCurrency) throw invalid("currency");

    const taxTotals = new Map<string, Money>();
    const invoiceLines = document.lines.map((line, index) => {
      if (!line.itemCode) throw invalid(`lines.${index}.itemCode`);
      const tax = options.taxTypes[line.taxCategory];
      if (!tax)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `taxTypes: none for ${line.taxCategory}`,
        });
      const sum = taxTotals.get(tax.taxType);
      taxTotals.set(tax.taxType, sum ? sum.plus(line.tax) : line.tax);
      return {
        description: line.description,
        itemType: line.itemCode.scheme,
        itemCode: line.itemCode.code,
        unitType: line.unitCode,
        quantity: line.quantity,
        internalCode: line.id,
        salesTotal: number(line.net),
        total: number(line.net.plus(line.tax)),
        valueDifference: 0,
        totalTaxableFees: 0,
        netTotal: number(line.net),
        itemsDiscount: 0,
        unitValue: { currencySold: document.currency, amountEGP: number(line.unitPrice) },
        discount: { rate: 0, amount: 0 },
        taxableItems: [
          {
            taxType: tax.taxType,
            amount: number(line.tax),
            subType: tax.subType,
            rate: Number(line.taxRate),
          },
        ],
      };
    });
    const body = {
      issuer: party(document.seller),
      receiver: party(document.buyer),
      documentType: DOCUMENT_TYPES[document.kind],
      documentTypeVersion: options.documentTypeVersion,
      dateTimeIssued: `${document.issuedAt.toISOString().slice(0, 19)}Z`,
      taxpayerActivityCode: options.activityCode,
      internalID: document.number,
      references: document.original
        ? [document.original.reference ?? document.original.number]
        : undefined,
      invoiceLines,
      totalDiscountAmount: 0,
      totalSalesAmount: number(document.net),
      netAmount: number(document.net),
      taxTotals: [...taxTotals].map(([taxType, amount]) => ({ taxType, amount: number(amount) })),
      totalAmount: number(document.gross),
      extraDiscountAmount: 0,
      totalItemsDiscountAmount: 0,
    };
    const canonical = canonicalEta(body);
    const hash = toBase64(await sha256(canonical));
    const signed = await this.signer.sign({
      unitId: context.unitId,
      format: SignatureFormat.Cades,
      payload: canonical,
      digest: hash,
    });
    return {
      payload: JSON.stringify({
        ...body,
        signatures: [{ signatureType: "I", value: signed.value }],
      }),
      contentType: "application/json",
      hash,
      signature: signed.value,
      qr: null,
      marks: {},
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Submits the document; accepted means `submitted` until the authority validates it. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(ETA_OPTIONS, context.options, this.key);
    const response = assertAnswered(
      await this.transport.send({
        method: "POST",
        url: options.submitUrl,
        credential: context.unitId,
        headers: { "Content-Type": "application/json" },
        body: `{"documents":[${record.payload}]}`,
      }),
      this.key,
    );
    let json: unknown;
    try {
      json = JSON.parse(response.body);
    } catch {
      json = null;
    }
    const answer = ANSWER.parse(json);
    const accepted = answer.acceptedDocuments?.find(
      (entry) => entry.internalId === record.documentNumber,
    );
    if (accepted)
      return {
        status: FiscalRecordStatus.Submitted,
        authorityReference: accepted.uuid,
        message: null,
        payload: null,
      };
    const rejected = answer.rejectedDocuments?.find(
      (entry) => entry.internalId === record.documentNumber,
    );
    return {
      status: FiscalRecordStatus.Rejected,
      authorityReference: answer.submissionId ?? null,
      message: rejected?.error?.message ?? `HTTP ${response.status}`,
      payload: null,
    };
  }

  /**
   * Asks the authority whether a submitted document is valid yet (`statusUrl` with its UUID).
   *
   * @returns the verdict, or `null` while the document is still being validated.
   * @throws FiscalOptionsInvalidError when the pack has no `statusUrl`.
   * @throws FiscalAuthorityUnavailableError when the authority cannot be reached.
   */
  override async poll(
    record: FiscalRecord,
    context: DriverContext,
  ): Promise<SubmissionOutcome | null> {
    const options = parseOptions(ETA_OPTIONS, context.options, this.key);
    if (!options.statusUrl)
      throw FiscalOptionsInvalidError.create({
        driver: this.key,
        issues: "statusUrl: required to poll",
      });
    const reference = record.authorityReference;
    if (!reference) return null;
    const response = assertAnswered(
      await this.transport.send({
        method: "GET",
        url: options.statusUrl.replace("{uuid}", encodeURIComponent(reference)),
        credential: context.unitId,
        headers: {},
        body: null,
      }),
      this.key,
    );
    return etaVerdict(response, reference);
  }

  /** The signed documents as JSON lines. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.eta.jsonl`);
  }
}

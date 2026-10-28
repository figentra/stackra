/**
 * Stackra file contract:
 * Purpose: `EtaReceiptDriver`, the `eta-receipt` mandate (Egypt's B2C e-receipt, ADR 0364 open question 1): the
 *          receipt JSON with every line's item code, its UUID (the SHA-256 of the canonical receipt with an empty
 *          UUID) chained to the POS's previous receipt UUID, the share-URL QR, submission in a batch of one, and
 *          validity polling.
 * Boundary: a driver of `FiscalDriver`, key `eta-receipt`, a second ETA driver beside `eta` (invoices): the receipt
 *           has its own document, endpoint, chain and POS credential, so it is not an `eta` option. Receipts are not
 *           signed; the POS's access token (from `EtaOnboardingDriver`) authenticates the transport, and the POS
 *           serial is read from `TillCredentials`. Sealing works offline. Endpoints, version, activity code, currency,
 *           tax types and payment codes are pack options; the receipt type letters and the QR layout are the
 *           format's. Certification against the ETA sandbox is stackra-31.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 8; open questions 1 and 2); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Money } from "@stackra/money";
import { z } from "zod";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import type { PartyKind } from "#contracts/enums/party-kind.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { ETA_RECEIPT_OPTIONS } from "#core/constants/eta-receipt-options.constant";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { canonicalEta } from "#core/functions/canonical-eta.function";
import { etaVerdict } from "#core/functions/eta-verdict.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { sha256 } from "#core/functions/sha256.function";
import { toHex } from "#core/functions/to-hex.function";

/** The format's buyer type letter per kind; an anonymous buyer is a person. */
const PARTY_TYPES: Readonly<Record<PartyKind, string>> = {
  business: "B",
  person: "P",
  foreign: "F",
};

/** The submission answer's parts the outcome reads. */
const ANSWER = z
  .object({
    submissionId: z.string().nullish(),
    acceptedDocuments: z.array(z.object({ uuid: z.string() })).nullish(),
    rejectedDocuments: z
      .array(z.object({ uuid: z.string(), error: z.object({ message: z.string() }).nullish() }))
      .nullish(),
  })
  .catch({});

/** A decimal amount as the JSON number the format carries. */
const number = (money: Money): number => Number(money.toDecimal());

/**
 * The `eta-receipt` driver: builds, chains, submits and polls B2C receipts per POS.
 *
 * @example
 * FiscalService.with([new EtaDriver(signer, transport), new EtaReceiptDriver(transport, credentials)], packs, journal, clock);
 */
export class EtaReceiptDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "eta-receipt";

  /** Reaches the receipt endpoints with the POS's access token. */
  private readonly transport: FiscalTransport;

  /** Holds the POS serial registered at onboarding. */
  private readonly credentials: TillCredentials;

  /**
   * @param transport - the host's HTTP binding, attaching the POS access token.
   * @param credentials - the till credential store `EtaOnboardingDriver` wrote.
   */
  constructor(transport: FiscalTransport, credentials: TillCredentials) {
    super();
    this.transport = transport;
    this.credentials = credentials;
  }

  /**
   * Builds the receipt, derives its UUID over the canonical form chained to the POS's previous receipt, and stamps the
   * QR text; works offline.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a category or tender has no code.
   * @throws FiscalDocumentInvalidError when the seller has no tax number or address, the currency is not the
   *   reporting currency, a line has no item code, there is no tender, a return has no original UUID, or the
   *   document is a debit note (receipts have none).
   * @throws FiscalCredentialMissingError when the POS has no registered serial.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(ETA_RECEIPT_OPTIONS, context.options, this.key);
    const invalid = (field: string) =>
      FiscalDocumentInvalidError.create({ driver: this.key, field });
    const misfit = (issues: string) =>
      FiscalOptionsInvalidError.create({ driver: this.key, issues });
    const rin = document.seller.taxId;
    const address = document.seller.address;
    if (!rin) throw invalid("seller.taxId");
    if (!address) throw invalid("seller.address");
    if (document.currency !== options.reportingCurrency) throw invalid("currency");
    if (document.kind === FiscalDocumentKind.DebitNote) throw invalid("kind");
    const returned = document.kind === FiscalDocumentKind.CreditNote;
    if (returned && !document.original?.reference) throw invalid("original.reference");
    const tender = document.payments[0];
    if (!tender) throw invalid("payments");
    const paymentMethod = options.paymentMethods[tender.method];
    if (!paymentMethod) throw misfit(`paymentMethods: none for ${tender.method}`);
    const serial = (await this.credentials.get(context.unitId))?.attributes?.[
      OnboardingInput.DeviceSerial
    ];
    if (!serial)
      throw FiscalCredentialMissingError.create({ unitId: context.unitId, driver: this.key });

    const taxTotals = new Map<string, Money>();
    const itemData = document.lines.map((line, index) => {
      if (!line.itemCode) throw invalid(`lines.${index}.itemCode`);
      const tax = options.taxTypes[line.taxCategory];
      if (!tax) throw misfit(`taxTypes: none for ${line.taxCategory}`);
      const sum = taxTotals.get(tax.taxType);
      taxTotals.set(tax.taxType, sum ? sum.plus(line.tax) : line.tax);
      return {
        internalCode: line.id,
        description: line.description,
        itemType: line.itemCode.scheme,
        itemCode: line.itemCode.code,
        unitType: line.unitCode,
        quantity: line.quantity,
        unitPrice: number(line.unitPrice),
        netSale: number(line.net),
        totalSale: number(line.net),
        total: number(line.net.plus(line.tax)),
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
    const dateTimeIssued = `${document.issuedAt.toISOString().slice(0, 19)}Z`;
    // The chain runs per POS; a previous record of another driver (a pack change) starts it afresh.
    const previousUUID = context.previous?.driver === this.key ? context.previous.hash : "";
    const receipt = (uuid: string) => ({
      header: {
        dateTimeIssued,
        receiptNumber: document.number,
        uuid,
        previousUUID,
        referenceUUID: returned ? document.original?.reference : undefined,
        currency: document.currency,
        exchangeRate: 0,
      },
      documentType: { receiptType: returned ? "R" : "S", typeVersion: options.typeVersion },
      seller: {
        rin,
        companyTradeName: document.seller.name,
        branchCode: address.branchId ?? "0",
        branchAddress: {
          country: address.country,
          governate: address.region ?? "",
          regionCity: address.city,
          street: address.street,
          buildingNumber: address.buildingNumber ?? "",
        },
        deviceSerialNumber: serial,
        activityCode: options.activityCode,
      },
      buyer: {
        type: PARTY_TYPES[document.buyer?.kind ?? "person"],
        id: document.buyer?.taxId ?? undefined,
        name: document.buyer?.name ?? undefined,
      },
      itemData,
      totalSales: number(document.net),
      netAmount: number(document.net),
      taxTotals: [...taxTotals].map(([taxType, amount]) => ({ taxType, amount: number(amount) })),
      totalAmount: number(document.gross),
      paymentMethod,
    });
    const uuid = toHex(await sha256(canonicalEta(receipt(""))));
    return {
      payload: JSON.stringify(receipt(uuid)),
      contentType: "application/json",
      hash: uuid,
      signature: null,
      qr: `${options.shareUrl}/${uuid}/share/${dateTimeIssued}#Total:${number(document.gross)},IssuerRIN:${rin}`,
      marks: { uuid },
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Submits the receipt; accepted means `submitted` until the authority validates it. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(ETA_RECEIPT_OPTIONS, context.options, this.key);
    const response = assertAnswered(
      await this.transport.send({
        method: "POST",
        url: options.submitUrl,
        credential: context.unitId,
        headers: { "Content-Type": "application/json" },
        body: `{"receipts":[${record.payload}]}`,
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
    if (answer.acceptedDocuments?.some((entry) => entry.uuid === record.hash))
      return {
        status: FiscalRecordStatus.Submitted,
        authorityReference: record.hash,
        message: null,
        payload: null,
      };
    const rejected = answer.rejectedDocuments?.find((entry) => entry.uuid === record.hash);
    return {
      status: FiscalRecordStatus.Rejected,
      authorityReference: answer.submissionId ?? null,
      message: rejected?.error?.message ?? `HTTP ${response.status}`,
      payload: null,
    };
  }

  /**
   * Asks the authority whether a submitted receipt is valid yet.
   *
   * @returns the verdict, or `null` while the receipt is still being validated.
   * @throws FiscalAuthorityUnavailableError when the authority cannot be reached.
   */
  override async poll(
    record: FiscalRecord,
    context: DriverContext,
  ): Promise<SubmissionOutcome | null> {
    const options = parseOptions(ETA_RECEIPT_OPTIONS, context.options, this.key);
    const response = assertAnswered(
      await this.transport.send({
        method: "GET",
        url: options.statusUrl.replace("{uuid}", encodeURIComponent(record.hash)),
        credential: context.unitId,
        headers: {},
        body: null,
      }),
      this.key,
    );
    return etaVerdict(response, record.hash);
  }

  /** The receipts as JSON lines. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.eta-receipt.jsonl`);
  }
}

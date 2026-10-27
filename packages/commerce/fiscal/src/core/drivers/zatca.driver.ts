/**
 * Stackra file contract:
 * Purpose: `ZatcaDriver`, the `zatca` mandate (ZATCA Phase 2): a UBL 2.1 invoice with the unit's invoice counter and
 *          the previous invoice hash, hashed, XAdES-signed by the unit's CSID key, stamped with the TLV receipt QR,
 *          then reported (simplified) or cleared (standard).
 * Boundary: a driver of `FiscalDriver`, key `zatca`. Sealing needs no network, so a till issues offline and reports
 *           later. The hash is SHA-256 of the canonical XML before the signature and the QR are added (the signer
 *           envelopes `ext:UBLExtensions` and `cac:Signature`, both outside the hash, at the sealing time it is
 *           handed; `XadesEnvelopeSignerDriver` is that signer over a host key). Endpoints, version, profile, tax
 *           currency, payment-means codes and time zone are pack options; the type codes and transaction flags are
 *           the mandate's format.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 8); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { z } from "zod";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { PartyKind } from "#contracts/enums/party-kind.enum";
import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { UBL_NAMESPACES } from "#core/constants/ubl-namespaces.constant";
import { ZATCA_OPTIONS } from "#core/constants/zatca-options.constant";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { encodeTlv } from "#core/functions/encode-tlv.function";
import { fromBase64 } from "#core/functions/from-base64.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { renderXml } from "#core/functions/render-xml.function";
import { sha256 } from "#core/functions/sha256.function";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toHex } from "#core/functions/to-hex.function";
import { ublAmount } from "#core/functions/ubl-amount.function";
import { ublParty } from "#core/functions/ubl-party.function";
import { ublTaxCategory } from "#core/functions/ubl-tax-category.function";
import { xmlElement } from "#core/functions/xml-element.function";
import { zatcaOutcome } from "#core/functions/zatca-outcome.function";
import { zatcaRequest } from "#core/functions/zatca-request.function";
import { zonedTime } from "#core/functions/zoned-time.function";
import type { XmlNode } from "#core/types/xml-node.type";

/** The mandate's invoice type code per document kind. */
const TYPE_CODES: Readonly<Record<FiscalDocumentKind, string>> = {
  invoice: "388",
  simplified: "388",
  credit_note: "381",
  debit_note: "383",
};

/** Whether a document is reported (simplified) rather than cleared (standard). */
const isSimplified = (document: FiscalDocument): boolean =>
  document.kind === FiscalDocumentKind.Simplified ||
  (document.kind !== FiscalDocumentKind.Invoice &&
    (document.buyer === null || document.buyer.kind === PartyKind.Person));

/**
 * Seals and submits ZATCA Phase 2 invoices for one unit's CSID.
 *
 * @example
 * new FiscalService([new ZatcaDriver(signer, transport)], packs, journal, clock);
 */
export class ZatcaDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "zatca";

  /** Signs with the unit's CSID key. */
  private readonly signer: FiscalSigner;

  /** Reaches the reporting and clearance endpoints with the unit's CSID. */
  private readonly transport: FiscalTransport;

  /**
   * @param signer - the unit's XAdES signer.
   * @param transport - the host's HTTP binding.
   */
  constructor(signer: FiscalSigner, transport: FiscalTransport) {
    super();
    this.signer = signer;
    this.transport = transport;
  }

  /**
   * Builds, hashes, signs and stamps the invoice; works offline.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit.
   * @throws FiscalDocumentInvalidError when the seller has no tax number, the currency is not the tax currency, a
   *   standard invoice has no buyer, or a note has no tender.
   * @throws FiscalCredentialMissingError when the signer returns no signed document or public key.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(ZATCA_OPTIONS, context.options, this.key);
    const simplified = isSimplified(document);
    const taxId = document.seller.taxId;
    if (!taxId)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "seller.taxId" });
    if (document.currency !== options.taxCurrency)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "currency" });
    if (!simplified && document.buyer === null)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "buyer" });
    if (document.original && document.payments.length === 0)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "payments" });
    for (const [index, payment] of document.payments.entries())
      if (!options.paymentMeans[payment.method])
        throw FiscalDocumentInvalidError.create({
          driver: this.key,
          field: `payments.${index}.method`,
        });

    // The first invoice of a unit chains to the mandate's seed: base64 of the hex SHA-256 of "0".
    const previousHash = context.previous?.hash ?? toBase64(toHex(await sha256("0")));
    const local = zonedTime(document.issuedAt, options.timeZone);
    const unsigned = renderXml(
      this.invoice(document, options, local, simplified, context.sequence, previousHash),
    );
    const hash = toBase64(await sha256(unsigned));
    const signed = await this.signer.sign({
      unitId: context.unitId,
      format: SignatureFormat.Xades,
      payload: unsigned,
      digest: hash,
      signedAt: context.now,
    });
    if (!signed.signedPayload || !signed.publicKey)
      throw FiscalCredentialMissingError.create({ unitId: context.unitId, driver: this.key });

    const qr = toBase64(
      encodeTlv([
        [1, document.seller.name],
        [2, taxId],
        [3, `${local.date}T${local.time}`],
        [4, document.gross.toDecimal()],
        [5, document.tax.toDecimal()],
        [6, hash],
        [7, signed.value],
        [8, fromBase64(signed.publicKey)],
        ...(simplified && signed.certificateSignature
          ? [[9, fromBase64(signed.certificateSignature)] as const]
          : []),
      ]),
    );
    const qrNode = renderXml(
      xmlElement(
        "cac:AdditionalDocumentReference",
        {},
        xmlElement("cbc:ID", {}, "QR"),
        xmlElement(
          "cac:Attachment",
          {},
          xmlElement("cbc:EmbeddedDocumentBinaryObject", { mimeCode: "text/plain" }, qr),
        ),
      ),
    );
    const anchor = signed.signedPayload.includes("<cac:Signature>")
      ? "<cac:Signature>"
      : "<cac:AccountingSupplierParty>";
    return {
      payload: signed.signedPayload.replace(anchor, `${qrNode}${anchor}`),
      contentType: "application/xml",
      hash,
      signature: signed.value,
      qr,
      marks: { simplified: String(simplified), counter: String(context.sequence) },
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Reports a simplified invoice or clears a standard one. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(ZATCA_OPTIONS, context.options, this.key);
    const simplified = record.marks.simplified === "true";
    const url = simplified ? options.reportingUrl : options.clearanceUrl;
    const response = await this.transport.send(
      zatcaRequest(record, url, options.apiVersion, !simplified),
    );
    return zatcaOutcome(assertAnswered(response, this.key));
  }

  /** The chain as JSON lines; every payload is the signed XML as sealed or cleared. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.zatca.jsonl`);
  }

  /** The UBL invoice without signature or QR. */
  private invoice(
    document: FiscalDocument,
    options: z.output<typeof ZATCA_OPTIONS>,
    local: { readonly date: string; readonly time: string },
    simplified: boolean,
    counter: number,
    previousHash: string,
  ): XmlNode {
    return xmlElement(
      "Invoice",
      {
        xmlns: UBL_NAMESPACES.invoice,
        "xmlns:cac": UBL_NAMESPACES.aggregate,
        "xmlns:cbc": UBL_NAMESPACES.basic,
        "xmlns:ext": UBL_NAMESPACES.extension,
      },
      xmlElement("cbc:ProfileID", {}, options.profileId),
      xmlElement("cbc:ID", {}, document.number),
      xmlElement("cbc:UUID", {}, document.id),
      xmlElement("cbc:IssueDate", {}, local.date),
      xmlElement("cbc:IssueTime", {}, local.time),
      xmlElement(
        "cbc:InvoiceTypeCode",
        { name: simplified ? "0200000" : "0100000" },
        TYPE_CODES[document.kind],
      ),
      xmlElement("cbc:DocumentCurrencyCode", {}, document.currency),
      xmlElement("cbc:TaxCurrencyCode", {}, options.taxCurrency),
      document.original &&
        xmlElement(
          "cac:BillingReference",
          {},
          xmlElement(
            "cac:InvoiceDocumentReference",
            {},
            xmlElement("cbc:ID", {}, document.original.number),
          ),
        ),
      xmlElement(
        "cac:AdditionalDocumentReference",
        {},
        xmlElement("cbc:ID", {}, "ICV"),
        xmlElement("cbc:UUID", {}, String(counter)),
      ),
      xmlElement(
        "cac:AdditionalDocumentReference",
        {},
        xmlElement("cbc:ID", {}, "PIH"),
        xmlElement(
          "cac:Attachment",
          {},
          xmlElement("cbc:EmbeddedDocumentBinaryObject", { mimeCode: "text/plain" }, previousHash),
        ),
      ),
      xmlElement("cac:AccountingSupplierParty", {}, ublParty(document.seller, false)),
      document.buyer &&
        xmlElement("cac:AccountingCustomerParty", {}, ublParty(document.buyer, false)),
      ...document.payments.map((payment, index) =>
        xmlElement(
          "cac:PaymentMeans",
          {},
          xmlElement("cbc:PaymentMeansCode", {}, options.paymentMeans[payment.method] ?? ""),
          index === 0 && document.original
            ? xmlElement("cbc:InstructionNote", {}, document.original.reason)
            : null,
        ),
      ),
      xmlElement(
        "cac:TaxTotal",
        {},
        ublAmount("cbc:TaxAmount", document.tax),
        ...taxBreakdown(document.lines).map((group) =>
          xmlElement(
            "cac:TaxSubtotal",
            {},
            ublAmount("cbc:TaxableAmount", group.net),
            ublAmount("cbc:TaxAmount", group.tax),
            ublTaxCategory("cac:TaxCategory", group.category, group.rate, group.exemption),
          ),
        ),
      ),
      xmlElement("cac:TaxTotal", {}, ublAmount("cbc:TaxAmount", document.tax)),
      xmlElement(
        "cac:LegalMonetaryTotal",
        {},
        ublAmount("cbc:LineExtensionAmount", document.net),
        ublAmount("cbc:TaxExclusiveAmount", document.net),
        ublAmount("cbc:TaxInclusiveAmount", document.gross),
        ublAmount("cbc:PayableAmount", document.gross),
      ),
      ...document.lines.map((line) =>
        xmlElement(
          "cac:InvoiceLine",
          {},
          xmlElement("cbc:ID", {}, line.id),
          xmlElement("cbc:InvoicedQuantity", { unitCode: line.unitCode }, String(line.quantity)),
          ublAmount("cbc:LineExtensionAmount", line.net),
          xmlElement(
            "cac:TaxTotal",
            {},
            ublAmount("cbc:TaxAmount", line.tax),
            ublAmount("cbc:RoundingAmount", line.net.plus(line.tax)),
          ),
          xmlElement(
            "cac:Item",
            {},
            xmlElement("cbc:Name", {}, line.description),
            ublTaxCategory("cac:ClassifiedTaxCategory", line.taxCategory, line.taxRate, null),
          ),
          xmlElement("cac:Price", {}, ublAmount("cbc:PriceAmount", line.unitPrice)),
        ),
      ),
    );
  }
}

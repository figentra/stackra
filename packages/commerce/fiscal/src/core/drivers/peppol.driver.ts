/**
 * Stackra file contract:
 * Purpose: `PeppolDriver`, the `peppol` mandate: a UBL 2.1 invoice or credit note under the customization and profile
 *          the pack names (a Peppol BIS for EU markets, a PINT for a market that routes through an accredited service
 *          provider), handed to the access point or ASP the pack names.
 * Boundary: a driver of `FiscalDriver`, key `peppol`. No signature: the four-corner network signs in transit. The
 *           access point delivers later, so an accepted hand-over is `submitted`. Both parties need an electronic
 *           address. The access point's credential is the host transport's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2 and 8); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { PEPPOL_OPTIONS } from "#core/constants/peppol-options.constant";
import { UBL_NAMESPACES } from "#core/constants/ubl-namespaces.constant";
import { UNCL_DOCUMENT_TYPES } from "#core/constants/uncl-document-types.constant";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { renderXml } from "#core/functions/render-xml.function";
import { sha256 } from "#core/functions/sha256.function";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { ublAmount } from "#core/functions/ubl-amount.function";
import { ublParty } from "#core/functions/ubl-party.function";
import { ublTaxCategory } from "#core/functions/ubl-tax-category.function";
import { xmlElement } from "#core/functions/xml-element.function";
import { zonedTime } from "#core/functions/zoned-time.function";

/**
 * Builds Peppol UBL and hands it to an access point.
 *
 * @example
 * FiscalService.with([new PeppolDriver(transport)], packs, journal, clock);
 */
export class PeppolDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "peppol";

  /** Reaches the access point with the tenant's credential. */
  private readonly transport: FiscalTransport;

  /**
   * @param transport - the host's HTTP binding.
   */
  constructor(transport: FiscalTransport) {
    super();
    this.transport = transport;
  }

  /**
   * Builds the UBL document and hashes it; works offline.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit.
   * @throws FiscalDocumentInvalidError when there is no buyer or a party has no electronic address.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(PEPPOL_OPTIONS, context.options, this.key);
    const buyer = document.buyer;
    if (!buyer) throw FiscalDocumentInvalidError.create({ driver: this.key, field: "buyer" });
    if (!document.seller.endpoint)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "seller.endpoint" });
    if (!buyer.endpoint)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "buyer.endpoint" });

    const credit = document.kind === FiscalDocumentKind.CreditNote;
    const root = credit ? "CreditNote" : "Invoice";
    const issueDate = zonedTime(document.issuedAt, options.timeZone).date;
    const payload = renderXml(
      xmlElement(
        root,
        {
          xmlns: credit ? UBL_NAMESPACES.creditNote : UBL_NAMESPACES.invoice,
          "xmlns:cac": UBL_NAMESPACES.aggregate,
          "xmlns:cbc": UBL_NAMESPACES.basic,
        },
        xmlElement("cbc:CustomizationID", {}, options.customizationId),
        xmlElement("cbc:ProfileID", {}, options.profileId),
        xmlElement("cbc:ID", {}, document.number),
        xmlElement("cbc:IssueDate", {}, issueDate),
        xmlElement(
          credit ? "cbc:CreditNoteTypeCode" : "cbc:InvoiceTypeCode",
          {},
          UNCL_DOCUMENT_TYPES[document.kind],
        ),
        xmlElement("cbc:DocumentCurrencyCode", {}, document.currency),
        xmlElement("cbc:BuyerReference", {}, document.buyerReference ?? document.number),
        document.original &&
          xmlElement(
            "cac:BillingReference",
            {},
            xmlElement(
              "cac:InvoiceDocumentReference",
              {},
              xmlElement("cbc:ID", {}, document.original.number),
              xmlElement(
                "cbc:IssueDate",
                {},
                zonedTime(document.original.issuedAt, options.timeZone).date,
              ),
            ),
          ),
        xmlElement("cac:AccountingSupplierParty", {}, ublParty(document.seller, true)),
        xmlElement("cac:AccountingCustomerParty", {}, ublParty(buyer, true)),
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
            credit ? "cac:CreditNoteLine" : "cac:InvoiceLine",
            {},
            xmlElement("cbc:ID", {}, line.id),
            xmlElement(
              credit ? "cbc:CreditedQuantity" : "cbc:InvoicedQuantity",
              { unitCode: line.unitCode },
              String(line.quantity),
            ),
            ublAmount("cbc:LineExtensionAmount", line.net),
            xmlElement(
              "cac:Item",
              {},
              xmlElement("cbc:Name", {}, line.description),
              line.itemCode &&
                xmlElement(
                  "cac:StandardItemIdentification",
                  {},
                  xmlElement("cbc:ID", { schemeID: line.itemCode.scheme }, line.itemCode.code),
                ),
              ublTaxCategory("cac:ClassifiedTaxCategory", line.taxCategory, line.taxRate, null),
            ),
            xmlElement("cac:Price", {}, ublAmount("cbc:PriceAmount", line.unitPrice)),
          ),
        ),
      ),
    );
    return {
      payload,
      contentType: "application/xml",
      hash: toBase64(await sha256(payload)),
      signature: null,
      qr: null,
      marks: {},
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Hands the document to the access point: 2xx is `submitted`, another answered status `rejected`. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(PEPPOL_OPTIONS, context.options, this.key);
    const response = assertAnswered(
      await this.transport.send({
        method: "POST",
        url: options.accessPointUrl,
        credential: context.unitId,
        headers: { "Content-Type": "application/xml" },
        body: record.payload,
      }),
      this.key,
    );
    const taken = response.status >= 200 && response.status < 300;
    return {
      status: taken ? FiscalRecordStatus.Submitted : FiscalRecordStatus.Rejected,
      authorityReference: null,
      message: taken ? null : response.body.slice(0, 1000) || `HTTP ${response.status}`,
      payload: null,
    };
  }

  /** The documents as JSON lines. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.peppol.jsonl`);
  }
}

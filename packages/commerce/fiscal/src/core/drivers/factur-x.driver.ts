/**
 * Stackra file contract:
 * Purpose: `FacturXDriver`, the `factur-x` mandate: a UN/CEFACT Cross Industry Invoice under the profile the pack
 *          names (Factur-X and ZUGFeRD share the syntax), embedded in the rendered PDF as a hybrid invoice, and handed
 *          to a platform when the pack names one.
 * Boundary: a driver of `FiscalDriver`, key `factur-x`. No signature; the hybrid PDF comes from `hybrid` through the
 *           `HybridPdf` port (`@stackra/documents`). With no platform in the pack, sealing completes the obligation.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1, 2, 6 and 8); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import type { Money } from "@stackra/money";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { HybridPdf } from "#contracts/ports/hybrid-pdf.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { CII_NAMESPACES } from "#core/constants/cii-namespaces.constant";
import { FACTUR_X_OPTIONS } from "#core/constants/factur-x-options.constant";
import { UNCL_DOCUMENT_TYPES } from "#core/constants/uncl-document-types.constant";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { renderXml } from "#core/functions/render-xml.function";
import { sha256 } from "#core/functions/sha256.function";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { xmlElement } from "#core/functions/xml-element.function";
import { zonedTime } from "#core/functions/zoned-time.function";
import type { XmlNode } from "#core/types/xml-node.type";

/** A CII trade party. */
const tradeParty = (name: string, party: FiscalParty): XmlNode =>
  xmlElement(
    name,
    {},
    xmlElement("ram:Name", {}, party.name),
    party.registration &&
      xmlElement(
        "ram:SpecifiedLegalOrganization",
        {},
        xmlElement("ram:ID", { schemeID: party.registration.scheme }, party.registration.id),
      ),
    party.address &&
      xmlElement(
        "ram:PostalTradeAddress",
        {},
        party.address.postalCode && xmlElement("ram:PostcodeCode", {}, party.address.postalCode),
        xmlElement(
          "ram:LineOne",
          {},
          party.address.buildingNumber
            ? `${party.address.street} ${party.address.buildingNumber}`
            : party.address.street,
        ),
        xmlElement("ram:CityName", {}, party.address.city),
        xmlElement("ram:CountryID", {}, party.address.country),
      ),
    party.endpoint &&
      xmlElement(
        "ram:URIUniversalCommunication",
        {},
        xmlElement("ram:URIID", { schemeID: party.endpoint.scheme }, party.endpoint.id),
      ),
    party.taxId &&
      xmlElement(
        "ram:SpecifiedTaxRegistration",
        {},
        xmlElement("ram:ID", { schemeID: "VA" }, party.taxId),
      ),
  );

/** A CII amount; the currency is stated only where the syntax asks for it. */
const amount = (name: string, money: Money, withCurrency = false): XmlNode =>
  xmlElement(name, withCurrency ? { currencyID: money.currency } : {}, money.toDecimal());

/**
 * Builds CII invoices and their hybrid PDFs.
 *
 * @example
 * const pdf = await driver.hybrid(record, rendered, { unitId, options });
 */
export class FacturXDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "factur-x";

  /** Reaches the platform, when the pack names one. */
  private readonly transport: FiscalTransport;

  /** Embeds the XML in a rendered PDF. */
  private readonly pdfs: HybridPdf;

  /**
   * @param transport - the host's HTTP binding.
   * @param pdfs - the hybrid PDF binding of `@stackra/documents`.
   */
  constructor(transport: FiscalTransport, pdfs: HybridPdf) {
    super();
    this.transport = transport;
    this.pdfs = pdfs;
  }

  /**
   * Builds the CII XML and hashes it; works offline.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit.
   * @throws FiscalDocumentInvalidError when there is no buyer.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(FACTUR_X_OPTIONS, context.options, this.key);
    const buyer = document.buyer;
    if (!buyer) throw FiscalDocumentInvalidError.create({ driver: this.key, field: "buyer" });
    const date = (instant: Date) => zonedTime(instant, options.timeZone).date.replaceAll("-", "");
    const payload = renderXml(
      xmlElement(
        "rsm:CrossIndustryInvoice",
        {
          "xmlns:rsm": CII_NAMESPACES.rsm,
          "xmlns:ram": CII_NAMESPACES.ram,
          "xmlns:udt": CII_NAMESPACES.udt,
        },
        xmlElement(
          "rsm:ExchangedDocumentContext",
          {},
          xmlElement(
            "ram:GuidelineSpecifiedDocumentContextParameter",
            {},
            xmlElement("ram:ID", {}, options.guidelineId),
          ),
        ),
        xmlElement(
          "rsm:ExchangedDocument",
          {},
          xmlElement("ram:ID", {}, document.number),
          xmlElement("ram:TypeCode", {}, UNCL_DOCUMENT_TYPES[document.kind]),
          xmlElement(
            "ram:IssueDateTime",
            {},
            xmlElement("udt:DateTimeString", { format: "102" }, date(document.issuedAt)),
          ),
        ),
        xmlElement(
          "rsm:SupplyChainTradeTransaction",
          {},
          ...document.lines.map((line) =>
            xmlElement(
              "ram:IncludedSupplyChainTradeLineItem",
              {},
              xmlElement(
                "ram:AssociatedDocumentLineDocument",
                {},
                xmlElement("ram:LineID", {}, line.id),
              ),
              xmlElement(
                "ram:SpecifiedTradeProduct",
                {},
                line.itemCode &&
                  xmlElement(
                    "ram:GlobalID",
                    { schemeID: line.itemCode.scheme },
                    line.itemCode.code,
                  ),
                xmlElement("ram:Name", {}, line.description),
              ),
              xmlElement(
                "ram:SpecifiedLineTradeAgreement",
                {},
                xmlElement(
                  "ram:NetPriceProductTradePrice",
                  {},
                  amount("ram:ChargeAmount", line.unitPrice),
                ),
              ),
              xmlElement(
                "ram:SpecifiedLineTradeDelivery",
                {},
                xmlElement(
                  "ram:BilledQuantity",
                  { unitCode: line.unitCode },
                  String(line.quantity),
                ),
              ),
              xmlElement(
                "ram:SpecifiedLineTradeSettlement",
                {},
                xmlElement(
                  "ram:ApplicableTradeTax",
                  {},
                  xmlElement("ram:TypeCode", {}, "VAT"),
                  xmlElement("ram:CategoryCode", {}, line.taxCategory),
                  xmlElement("ram:RateApplicablePercent", {}, line.taxRate),
                ),
                xmlElement(
                  "ram:SpecifiedTradeSettlementLineMonetarySummation",
                  {},
                  amount("ram:LineTotalAmount", line.net),
                ),
              ),
            ),
          ),
          xmlElement(
            "ram:ApplicableHeaderTradeAgreement",
            {},
            document.buyerReference &&
              xmlElement("ram:BuyerReference", {}, document.buyerReference),
            tradeParty("ram:SellerTradeParty", document.seller),
            tradeParty("ram:BuyerTradeParty", buyer),
          ),
          xmlElement("ram:ApplicableHeaderTradeDelivery", {}),
          xmlElement(
            "ram:ApplicableHeaderTradeSettlement",
            {},
            xmlElement("ram:InvoiceCurrencyCode", {}, document.currency),
            ...taxBreakdown(document.lines).map((group) =>
              xmlElement(
                "ram:ApplicableTradeTax",
                {},
                amount("ram:CalculatedAmount", group.tax),
                xmlElement("ram:TypeCode", {}, "VAT"),
                group.exemption && xmlElement("ram:ExemptionReason", {}, group.exemption.reason),
                amount("ram:BasisAmount", group.net),
                xmlElement("ram:CategoryCode", {}, group.category),
                group.exemption && xmlElement("ram:ExemptionReasonCode", {}, group.exemption.code),
                xmlElement("ram:RateApplicablePercent", {}, group.rate),
              ),
            ),
            xmlElement(
              "ram:SpecifiedTradeSettlementHeaderMonetarySummation",
              {},
              amount("ram:LineTotalAmount", document.net),
              amount("ram:TaxBasisTotalAmount", document.net),
              amount("ram:TaxTotalAmount", document.tax, true),
              amount("ram:GrandTotalAmount", document.gross),
              amount("ram:DuePayableAmount", document.gross),
            ),
            document.original &&
              xmlElement(
                "ram:InvoiceReferencedDocument",
                {},
                xmlElement("ram:IssuerAssignedID", {}, document.original.number),
                xmlElement(
                  "ram:FormattedIssueDateTime",
                  {},
                  xmlElement(
                    "udt:DateTimeString",
                    { format: "102" },
                    date(document.original.issuedAt),
                  ),
                ),
              ),
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
      status: options.submitUrl === null ? FiscalRecordStatus.Accepted : FiscalRecordStatus.Sealed,
    };
  }

  /** Hands the XML to the pack's platform; with none there is nothing to hand over. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(FACTUR_X_OPTIONS, context.options, this.key);
    if (options.submitUrl === null)
      return {
        status: FiscalRecordStatus.Accepted,
        authorityReference: null,
        message: null,
        payload: null,
      };
    const response = assertAnswered(
      await this.transport.send({
        method: "POST",
        url: options.submitUrl,
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
    return jsonLinesExport(records, `${context.unitId}.factur-x.jsonl`);
  }

  /**
   * The hybrid invoice: `pdf` (the rendered invoice) with the record's XML embedded under the pack's file name and
   * XMP facts.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit.
   */
  async hybrid(record: FiscalRecord, pdf: Uint8Array, context: DriverContext): Promise<Uint8Array> {
    const options = parseOptions(FACTUR_X_OPTIONS, context.options, this.key);
    return this.pdfs.attach({
      pdf,
      xml: record.payload,
      fileName: options.fileName,
      conformanceLevel: options.conformanceLevel,
      version: options.version,
      documentType: options.documentType,
    });
  }
}

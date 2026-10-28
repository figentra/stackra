/**
 * Stackra file contract:
 * Purpose: `VerifactuDriver`, the `verifactu` till and invoice rule: a billing record whose fingerprint is the
 *          SHA-256 of its key fields and the previous record's fingerprint, wrapped in the submission envelope, with
 *          the verification QR URL; the record is sent to the authority after sealing.
 * Boundary: a driver of `FiscalDriver`, key `verifactu`. Sealing is offline; submission is a SOAP POST of the sealed
 *           envelope through the host transport (which presents the issuer's certificate). The issue date of each
 *           record is kept in its `issueDate` mark so the next record can name it. Every code, namespace, endpoint and
 *           the billing-system declaration are pack options; the fingerprint string and its `01` type are the
 *           format's.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 7); ADR 0363 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Money } from "@stackra/money";

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
import { VERIFACTU_OPTIONS } from "#core/constants/verifactu-options.constant";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { assertAnswered } from "#core/functions/assert-answered.function";
import { jsonLinesExport } from "#core/functions/json-lines-export.function";
import { parseOptions } from "#core/functions/parse-options.function";
import { renderXml } from "#core/functions/render-xml.function";
import { sha256 } from "#core/functions/sha256.function";
import { taxBreakdown } from "#core/functions/tax-breakdown.function";
import { toHex } from "#core/functions/to-hex.function";
import { xmlElement } from "#core/functions/xml-element.function";
import { zonedTime } from "#core/functions/zoned-time.function";

/** `YYYY-MM-DD` as the format's `DD-MM-YYYY`. */
// oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
const dayFirst = (date: string): string => date.split("-").reverse().join("-");

/** The first match of a tag's text in an answer, whatever its prefix. */
const tagText = (body: string, tag: string): string | null =>
  new RegExp(`<(?:[\\w-]+:)?${tag}>([^<]*)</`).exec(body)?.[1] ?? null;

/**
 * Seals and sends billing records for one issuer's system installation.
 *
 * @example
 * FiscalService.with([new VerifactuDriver(transport)], packs, journal, clock);
 */
export class VerifactuDriver extends Driver(FiscalDriver) {
  /** The key a pack names. */
  readonly key = "verifactu";

  /** Reaches the authority with the issuer's certificate. */
  private readonly transport: FiscalTransport;

  /**
   * @param transport - the host's HTTP binding.
   */
  constructor(transport: FiscalTransport) {
    super();
    this.transport = transport;
  }

  /**
   * Builds and fingerprints the record onto the chain; a credit note's amounts are negative.
   *
   * @throws FiscalOptionsInvalidError when the pack options do not fit or a category has no qualification.
   * @throws FiscalDocumentInvalidError when the seller has no tax number.
   */
  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    const options = parseOptions(VERIFACTU_OPTIONS, context.options, this.key);
    const issuer = document.seller.taxId;
    if (!issuer)
      throw FiscalDocumentInvalidError.create({ driver: this.key, field: "seller.taxId" });
    const credit = document.kind === FiscalDocumentKind.CreditNote;
    const signed = (money: Money) =>
      (credit ? Money.zero(money.currency).minus(money) : money).toDecimal();
    const issueDate = dayFirst(zonedTime(document.issuedAt, options.timeZone).date);
    const now = zonedTime(context.now, options.timeZone);
    const recordedAt = `${now.date}T${now.time}${now.offset}`;
    const type = options.invoiceTypes[document.kind];
    const previous = context.previous;
    const fingerprint = toHex(
      await sha256(
        [
          `IDEmisorFactura=${issuer}`,
          `NumSerieFactura=${document.number}`,
          `FechaExpedicionFactura=${issueDate}`,
          `TipoFactura=${type}`,
          `CuotaTotal=${signed(document.tax)}`,
          `ImporteTotal=${signed(document.gross)}`,
          `Huella=${previous?.hash ?? ""}`,
          `FechaHoraHusoGenRegistro=${recordedAt}`,
        ].join("&"),
      ),
    ).toUpperCase();
    const id = (name: string, number: string, date: string) =>
      xmlElement(
        name,
        {},
        xmlElement("sum1:IDEmisorFactura", {}, issuer),
        xmlElement("sum1:NumSerieFactura", {}, number),
        xmlElement("sum1:FechaExpedicionFactura", {}, date),
      );
    const breakdown = taxBreakdown(document.lines).map((group) => {
      const qualification = options.qualifications[group.category];
      if (!qualification)
        throw FiscalOptionsInvalidError.create({
          driver: this.key,
          issues: `qualifications: none for ${group.category}`,
        });
      const exempt = qualification.startsWith("E");
      return xmlElement(
        "sum1:DetalleDesglose",
        {},
        xmlElement("sum1:ClaveRegimen", {}, options.regimeKey),
        xmlElement(
          exempt ? "sum1:OperacionExenta" : "sum1:CalificacionOperacion",
          {},
          qualification,
        ),
        exempt ? null : xmlElement("sum1:TipoImpositivo", {}, group.rate),
        xmlElement("sum1:BaseImponibleOimporteNoSujeto", {}, signed(group.net)),
        exempt ? null : xmlElement("sum1:CuotaRepercutida", {}, signed(group.tax)),
      );
    });
    const payload = renderXml(
      xmlElement(
        "soapenv:Envelope",
        {
          "xmlns:soapenv": options.namespaces.envelope,
          "xmlns:sum": options.namespaces.submission,
          "xmlns:sum1": options.namespaces.information,
        },
        xmlElement("soapenv:Header", {}),
        xmlElement(
          "soapenv:Body",
          {},
          xmlElement(
            "sum:RegFactuSistemaFacturacion",
            {},
            xmlElement(
              "sum:Cabecera",
              {},
              xmlElement(
                "sum1:ObligadoEmision",
                {},
                xmlElement("sum1:NombreRazon", {}, document.seller.name),
                xmlElement("sum1:NIF", {}, issuer),
              ),
            ),
            xmlElement(
              "sum:RegistroFactura",
              {},
              xmlElement(
                "sum1:RegistroAlta",
                {},
                xmlElement("sum1:IDVersion", {}, options.version),
                id("sum1:IDFactura", document.number, issueDate),
                xmlElement("sum1:NombreRazonEmisor", {}, document.seller.name),
                xmlElement("sum1:TipoFactura", {}, type),
                document.original && xmlElement("sum1:TipoRectificativa", {}, "I"),
                document.original &&
                  xmlElement(
                    "sum1:FacturasRectificadas",
                    {},
                    id(
                      "sum1:IDFacturaRectificada",
                      document.original.number,
                      dayFirst(zonedTime(document.original.issuedAt, options.timeZone).date),
                    ),
                  ),
                xmlElement("sum1:DescripcionOperacion", {}, options.operationDescription),
                document.buyer?.taxId
                  ? xmlElement(
                      "sum1:Destinatarios",
                      {},
                      xmlElement(
                        "sum1:IDDestinatario",
                        {},
                        xmlElement("sum1:NombreRazon", {}, document.buyer.name),
                        xmlElement("sum1:NIF", {}, document.buyer.taxId),
                      ),
                    )
                  : null,
                xmlElement("sum1:Desglose", {}, ...breakdown),
                xmlElement("sum1:CuotaTotal", {}, signed(document.tax)),
                xmlElement("sum1:ImporteTotal", {}, signed(document.gross)),
                xmlElement(
                  "sum1:Encadenamiento",
                  {},
                  previous
                    ? xmlElement(
                        "sum1:RegistroAnterior",
                        {},
                        xmlElement("sum1:IDEmisorFactura", {}, issuer),
                        xmlElement("sum1:NumSerieFactura", {}, previous.documentNumber),
                        xmlElement(
                          "sum1:FechaExpedicionFactura",
                          {},
                          previous.marks.issueDate ?? "",
                        ),
                        xmlElement("sum1:Huella", {}, previous.hash),
                      )
                    : xmlElement("sum1:PrimerRegistro", {}, "S"),
                ),
                xmlElement(
                  "sum1:SistemaInformatico",
                  {},
                  xmlElement("sum1:NombreRazon", {}, options.system.producerName),
                  xmlElement("sum1:NIF", {}, options.system.producerTaxId),
                  xmlElement("sum1:NombreSistemaInformatico", {}, options.system.name),
                  xmlElement("sum1:IdSistemaInformatico", {}, options.system.id),
                  xmlElement("sum1:Version", {}, options.system.version),
                  xmlElement("sum1:NumeroInstalacion", {}, context.unitId),
                  xmlElement("sum1:TipoUsoPosibleSoloVerifactu", {}, options.system.onlyVerifactu),
                  xmlElement("sum1:TipoUsoPosibleMultiOT", {}, options.system.multipleTaxpayers),
                  xmlElement(
                    "sum1:IndicadorMultiplesOT",
                    {},
                    options.system.multipleTaxpayersInUse,
                  ),
                ),
                xmlElement("sum1:FechaHoraHusoGenRegistro", {}, recordedAt),
                xmlElement("sum1:TipoHuella", {}, "01"),
                xmlElement("sum1:Huella", {}, fingerprint),
              ),
            ),
          ),
        ),
      ),
    );
    const query = new URLSearchParams({
      nif: issuer,
      numserie: document.number,
      fecha: issueDate,
      importe: signed(document.gross),
    });
    return {
      payload,
      contentType: "text/xml",
      hash: fingerprint,
      signature: null,
      qr: `${options.qrUrl}?${query.toString()}`,
      marks: { issueDate },
      status: FiscalRecordStatus.Sealed,
    };
  }

  /** Sends the envelope: a correct or accepted-with-errors record is accepted, an incorrect one rejected. */
  async submit(record: FiscalRecord, context: DriverContext): Promise<SubmissionOutcome> {
    const options = parseOptions(VERIFACTU_OPTIONS, context.options, this.key);
    const response = assertAnswered(
      await this.transport.send({
        method: "POST",
        url: options.submitUrl,
        credential: context.unitId,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: record.payload,
      }),
      this.key,
    );
    const state = tagText(response.body, "EstadoRegistro");
    const accepted =
      response.status < 300 && (state === "Correcto" || state === "AceptadoConErrores");
    return {
      status: accepted ? FiscalRecordStatus.Accepted : FiscalRecordStatus.Rejected,
      authorityReference: tagText(response.body, "CSV"),
      message:
        tagText(response.body, "DescripcionErrorRegistro") ??
        (accepted ? null : `HTTP ${response.status}`),
      payload: null,
    };
  }

  /** The records as JSON lines. */
  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return jsonLinesExport(records, `${context.unitId}.verifactu.jsonl`);
  }
}

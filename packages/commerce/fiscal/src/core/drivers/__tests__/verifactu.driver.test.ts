/**
 * Stackra file contract:
 * Purpose: unit tests of `VerifactuDriver`: the fingerprint over the record's key fields and the previous
 *          fingerprint, the first and chained records, exempt and corrective records, the QR URL, the submission
 *          answer, and the export.
 * Boundary: test only; the transport is a fake and the options are samples (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import { VerifactuDriver } from "#core/drivers/verifactu.driver";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";
import { sha256 } from "#core/functions/sha256.function";
import { toHex } from "#core/functions/to-hex.function";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";

const OPTIONS = {
  submitUrl: "https://authority.test/records",
  qrUrl: "https://authority.test/qr",
  version: "1.0",
  namespaces: {
    envelope: "https://ns.test/envelope",
    submission: "https://ns.test/submission",
    information: "https://ns.test/information",
  },
  invoiceTypes: { invoice: "F1", simplified: "F2", credit_note: "R1", debit_note: "R1" },
  regimeKey: "01",
  qualifications: { S: "S1", E: "E1" },
  operationDescription: "Sales",
  system: {
    producerName: "Producer",
    producerTaxId: "TAX-P",
    name: "System",
    id: "SY",
    version: "1",
    onlyVerifactu: "S",
    multipleTaxpayers: "N",
    multipleTaxpayersInUse: "N",
  },
  timeZone: "UTC",
};
const context = {
  unitId: "till_1",
  options: OPTIONS,
  previous: null,
  sequence: 1,
  now: new Date(0),
};
const driver = (transport = FiscalTransportFake.answering()) => new VerifactuDriver(transport);

describe("VerifactuDriver#seal", () => {
  it("fingerprints the first record and builds the QR URL", async () => {
    const sealed = await driver().seal(fiscalDocument(), context);
    const expected = toHex(
      await sha256(
        "IDEmisorFactura=TAX-SELLER-1&NumSerieFactura=INV-0001&FechaExpedicionFactura=01-03-2026&TipoFactura=F1" +
          "&CuotaTotal=5.00&ImporteTotal=35.00&Huella=&FechaHoraHusoGenRegistro=1970-01-01T00:00:00+00:00",
      ),
    ).toUpperCase();
    expect(sealed.hash).toBe(expected);
    expect(sealed.payload).toContain(`<sum1:Huella>${expected}</sum1:Huella>`);
    expect(sealed.payload).toContain("<sum1:PrimerRegistro>S</sum1:PrimerRegistro>");
    expect(sealed.payload).toContain("<sum1:NumeroInstalacion>till_1</sum1:NumeroInstalacion>");
    expect(sealed.qr).toBe(
      "https://authority.test/qr?nif=TAX-SELLER-1&numserie=INV-0001&fecha=01-03-2026&importe=35.00",
    );
    expect([sealed.marks, sealed.status]).toEqual([
      { issueDate: "01-03-2026" },
      FiscalRecordStatus.Sealed,
    ]);
  });

  it("chains to the previous record and writes a corrective record negative", async () => {
    const previous = fiscalRecord({
      documentNumber: "INV-0000",
      hash: "PREVHASH",
      marks: { issueDate: "28-02-2026" },
    });
    const note = fiscalDocument({
      kind: FiscalDocumentKind.CreditNote,
      original: {
        number: "INV-0000",
        issuedAt: new Date("2026-02-28T10:00:00Z"),
        reason: "returned",
        reference: null,
      },
    });
    const { payload } = await driver().seal(note, { ...context, previous, sequence: 2 });
    expect(payload).toContain(
      "<sum1:RegistroAnterior><sum1:IDEmisorFactura>TAX-SELLER-1</sum1:IDEmisorFactura><sum1:NumSerieFactura>INV-0000</sum1:NumSerieFactura>" +
        "<sum1:FechaExpedicionFactura>28-02-2026</sum1:FechaExpedicionFactura><sum1:Huella>PREVHASH</sum1:Huella></sum1:RegistroAnterior>",
    );
    expect(payload).toContain(
      "<sum1:TipoFactura>R1</sum1:TipoFactura><sum1:TipoRectificativa>I</sum1:TipoRectificativa>",
    );
    expect(payload).toContain("<sum1:ImporteTotal>-35.00</sum1:ImporteTotal>");
  });

  it("marks an exempt operation and leaves its rate out", async () => {
    const [line] = fiscalDocument().lines as readonly [FiscalLine, FiscalLine];
    const exempt = { ...line, taxCategory: "E", taxRate: "0", tax: line.tax.minus(line.tax) };
    const { payload } = await driver().seal(fiscalDocument({ lines: [exempt] }), context);
    expect(payload).toContain(
      "<sum1:OperacionExenta>E1</sum1:OperacionExenta><sum1:BaseImponibleOimporteNoSujeto>20.00",
    );
    expect(payload).not.toContain("<sum1:TipoImpositivo>");
  });

  it("refuses a seller without a tax number and a category the pack does not qualify", async () => {
    const { seller } = fiscalDocument();
    await expect(
      driver().seal(fiscalDocument({ seller: { ...seller, taxId: null } }), context),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalDocumentInvalidError));
    await expect(
      driver().seal(fiscalDocument(), { ...context, options: { ...OPTIONS, qualifications: {} } }),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalOptionsInvalidError));
  });
});

describe("VerifactuDriver#submit", () => {
  it("accepts a correct record with its CSV code", async () => {
    const body = "<env><t:EstadoRegistro>Correcto</t:EstadoRegistro><t:CSV>CSV123</t:CSV></env>";
    const outcome = await driver(
      FiscalTransportFake.answering({ status: 200, headers: {}, body }),
    ).submit(fiscalRecord(), context);
    expect([outcome.status, outcome.authorityReference, outcome.message]).toEqual([
      FiscalRecordStatus.Accepted,
      "CSV123",
      null,
    ]);
  });

  it("rejects an incorrect record with its description", async () => {
    const body =
      "<env><t:EstadoRegistro>Incorrecto</t:EstadoRegistro><t:DescripcionErrorRegistro>bad</t:DescripcionErrorRegistro></env>";
    const outcome = await driver(
      FiscalTransportFake.answering({ status: 200, headers: {}, body }),
    ).submit(fiscalRecord(), context);
    expect([outcome.status, outcome.message]).toEqual([FiscalRecordStatus.Rejected, "bad"]);
  });
});

describe("VerifactuDriver#exportJournal", () => {
  it("exports JSON lines", async () => {
    expect((await driver().exportJournal([], context)).fileName).toBe("till_1.verifactu.jsonl");
  });
});

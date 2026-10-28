/**
 * Stackra file contract:
 * Purpose: `certificationCases`, the recorded reference cases of the fiscal certification harness, one or more per
 *          authority: ZATCA Phase 2 (the PIH seed, the profile and type codes, the TLV QR layout, the standard
 *          invoice's supply date), AEAT Verifactu (the two published `Huella` examples and the QR URL), the German
 *          DSFinV-K receipt QR (the TSE), the Austrian RKSV machine-readable code, and the Egyptian ETA e-receipt (the
 *          UUID chain start and the share QR).
 * Boundary: test data in the `./testing` entry. Expected values are taken from the published specifications named in
 *           each case's `source`; the pack options carry the authorities' published sandbox (simulation,
 *           pre-production) endpoints so a sandbox run only adds credentials and the registered seller from config.
 *           Device, signer and cipher answers are recorded samples, not authority values. Nothing here has passed a
 *           sandbox yet: certification pending (owner decision D3, 2026-10-27).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4 and 8); ADR 0269; ADR 0363 (decision 9: samples, not a market's
 *                     rules in code).
 */
import { Money } from "@stackra/money";

import { FiscalDocumentKind } from "#contracts/enums/fiscal-document-kind.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";
import { PartyKind } from "#contracts/enums/party-kind.enum";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalLine } from "#contracts/types/fiscal-line.type";
import type { FiscalParty } from "#contracts/types/fiscal-party.type";
import { EtaReceiptDriver } from "#core/drivers/eta-receipt.driver";
import { RksvDriver } from "#core/drivers/rksv.driver";
import { TseDriver } from "#core/drivers/tse.driver";
import { VerifactuDriver } from "#core/drivers/verifactu.driver";
import { ZatcaDriver } from "#core/drivers/zatca.driver";
import type { CertificationCase } from "#testing/certification-case.type";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

/** One standard-rated line of `net` and `tax` minor units. */
const line = (currency: string, net: number, tax: number, rate: string): FiscalLine => {
  const money = (minor: number) => Money.ofMinor(minor, currency);
  return {
    id: "1",
    description: "Item",
    quantity: 1,
    unitCode: "C62",
    unitPrice: money(net),
    net: money(net),
    tax: money(tax),
    taxCategory: "S",
    taxRate: rate,
    exemption: null,
    itemCode: { scheme: "EGS", code: "EG-000000000-1" },
  };
};

/** A one-line document in `currency` paid in cash. */
const document = (
  currency: string,
  net: number,
  tax: number,
  rate: string,
  overrides: Partial<FiscalDocument>,
): FiscalDocument => {
  const money = (minor: number) => Money.ofMinor(minor, currency);
  return fiscalDocument({
    currency: money(0).currency,
    lines: [line(currency, net, tax, rate)],
    payments: [{ method: "cash", amount: money(net + tax) }],
    net: money(net),
    tax: money(tax),
    gross: money(net + tax),
    ...overrides,
  });
};

/** ZATCA developer portal (Fatoora simulation shares the paths under `/simulation`). */
const ZATCA_PORTAL = "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal";
const ZATCA = {
  reportingUrl: `${ZATCA_PORTAL}/invoices/reporting/single`,
  clearanceUrl: `${ZATCA_PORTAL}/invoices/clearance/single`,
  complianceCsidUrl: `${ZATCA_PORTAL}/compliance`,
  complianceInvoicesUrl: `${ZATCA_PORTAL}/compliance/invoices`,
  productionCsidUrl: `${ZATCA_PORTAL}/production/csids`,
  apiVersion: "V2",
  profileId: "reporting:1.0",
  taxCurrency: "SAR",
  paymentMeans: { cash: "10", card: "48" },
  timeZone: "Asia/Riyadh",
};
/** The seller of ZATCA's published QR example. */
const ZATCA_SELLER: FiscalParty = {
  kind: PartyKind.Business,
  name: "Bobs Records",
  taxId: "310122393500003",
  registration: { scheme: "CRN", id: "1010010000" },
  address: {
    street: "Prince Sultan",
    buildingNumber: "2322",
    district: "Al-Murabba",
    city: "Riyadh",
    region: "Riyadh",
    postalCode: "23333",
    country: "SA",
    branchId: "0",
  },
  endpoint: null,
};
/** Base64 of the SHA-256 hex of "0", the PIH of a unit's first invoice (ZATCA XML implementation standard). */
const ZATCA_PIH_SEED =
  "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";
const ZATCA_ISSUED = new Date("2022-04-25T12:30:00Z");

/** AEAT pre-production (VERI*FACTU) endpoints and the published schema namespaces. */
const AEAT_STATIC =
  "https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws";
const VERIFACTU = {
  submitUrl: "https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP",
  qrUrl: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR",
  version: "1.0",
  namespaces: {
    envelope: "http://schemas.xmlsoap.org/soap/envelope/",
    submission: `${AEAT_STATIC}/SuministroLR.xsd`,
    information: `${AEAT_STATIC}/SuministroInformacion.xsd`,
  },
  invoiceTypes: { invoice: "F1", simplified: "F2", credit_note: "R1", debit_note: "R1" },
  regimeKey: "01",
  qualifications: { S: "S1", E: "E1" },
  operationDescription: "Venta",
  system: {
    producerName: "Stackra",
    producerTaxId: "89890001K",
    name: "Stackra fiscal",
    id: "ST",
    version: "1.0",
    onlyVerifactu: "S",
    multipleTaxpayers: "N",
    multipleTaxpayersInUse: "N",
  },
  timeZone: "Europe/Madrid",
};
const AEAT_SELLER = { ...ZATCA_SELLER, name: "Empresa Ejemplo SL", taxId: "89890001K" };
const AEAT_ANSWER = {
  status: 200,
  headers: { "content-type": "text/xml" },
  body:
    '<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body>' +
    "<tikR:RespuestaRegFactuSistemaFacturacion><tikR:CSV>A-RECORDED0000001</tikR:CSV>" +
    "<tikR:EstadoEnvio>Correcto</tikR:EstadoEnvio><tikR:RespuestaLinea>" +
    "<tikR:EstadoRegistro>Correcto</tikR:EstadoRegistro></tikR:RespuestaLinea>" +
    "</tikR:RespuestaRegFactuSistemaFacturacion></env:Body></env:Envelope>",
};
/** The two chained examples of AEAT's "Detalle de las especificaciones técnicas para generación de la huella". */
const HUELLA_1 = "3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60";
const HUELLA_2 = "F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97";

/**
 * Every reference case, in authority order.
 *
 * @example
 * for (const certification of certificationCases())
 *   expect((await runCertification(certification)).mismatches).toEqual([]);
 */
export function certificationCases(): CertificationCase[] {
  return [
    {
      id: "zatca.simplified-first",
      authority: "ZATCA Phase 2 (Saudi Arabia), reporting",
      source:
        "ZATCA E-Invoicing XML Implementation Standard and Security Features Implementation Standard " +
        "(PIH of the first invoice, ICV, KSA-2 transaction flags, QR tags 1 to 9)",
      driver: (ports) => new ZatcaDriver(ports.signer, ports.transport),
      options: ZATCA,
      document: document("SAR", 86_957, 13_043, "15", {
        id: "3cf5ee18-ee25-44ea-a444-2c37ba7f28be",
        number: "SME00001",
        kind: FiscalDocumentKind.Simplified,
        issuedAt: ZATCA_ISSUED,
        seller: ZATCA_SELLER,
        buyer: null,
      }),
      context: { unitId: "egs_1", previous: null, sequence: 1, now: ZATCA_ISSUED },
      recorded: {
        answers: [
          {
            status: 200,
            headers: {},
            body: '{"reportingStatus":"REPORTED","validationResults":{}}',
          },
        ],
      },
      expect: {
        payload: [
          "<cbc:ProfileID>reporting:1.0</cbc:ProfileID>",
          "<cbc:IssueDate>2022-04-25</cbc:IssueDate><cbc:IssueTime>15:30:00</cbc:IssueTime>",
          '<cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>',
          "<cbc:ID>ICV</cbc:ID><cbc:UUID>1</cbc:UUID>",
          `<cbc:ID>PIH</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${ZATCA_PIH_SEED}</cbc:EmbeddedDocumentBinaryObject></cac:Attachment>`,
          "<cbc:ID>QR</cbc:ID>",
        ],
        // TLV tags 1 to 5 (seller, VAT number, local time, total, VAT): 69 bytes, so a whole base64 prefix.
        qrContains: [
          "AQxCb2JzIFJlY29yZHMCDzMxMDEyMjM5MzUwMDAwMwMTMjAyMi0wNC0yNVQxNTozMDowMAQHMTAwMC4wMAUGMTMwLjQz",
        ],
        outcome: FiscalRecordStatus.Accepted,
      },
    },
    {
      id: "zatca.standard-supply-date",
      authority: "ZATCA Phase 2 (Saudi Arabia), clearance",
      source:
        "ZATCA E-Invoicing XML Implementation Standard, BR-KSA-15 (supply date on a standard tax invoice)",
      driver: (ports) => new ZatcaDriver(ports.signer, ports.transport),
      options: ZATCA,
      document: document("SAR", 86_957, 13_043, "15", {
        id: "16e78469-64af-406d-9cfd-895e724198f0",
        number: "STD00001",
        kind: FiscalDocumentKind.Invoice,
        issuedAt: ZATCA_ISSUED,
        seller: ZATCA_SELLER,
        buyer: { ...ZATCA_SELLER, name: "Buyer Trading", taxId: "300000000000003" },
      }),
      context: { unitId: "egs_1", previous: null, sequence: 1, now: ZATCA_ISSUED },
      recorded: {},
      expect: {
        payload: [
          '<cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>',
          "<cac:Delivery><cbc:ActualDeliveryDate>2022-04-25</cbc:ActualDeliveryDate></cac:Delivery>",
          `>${ZATCA_PIH_SEED}<`,
        ],
      },
    },
    {
      id: "verifactu.huella-first",
      authority: "AEAT VERI*FACTU (Spain)",
      source:
        "AEAT, Detalle de las especificaciones técnicas para generación de la huella o hash, example 1 " +
        "(first record); Orden HAC/1177/2024 QR specification",
      driver: (ports) => new VerifactuDriver(ports.transport),
      options: VERIFACTU,
      document: document("EUR", 11_110, 1235, "21", {
        number: "12345678/G33",
        issuedAt: new Date("2024-01-01T09:00:00Z"),
        seller: AEAT_SELLER,
        buyer: null,
      }),
      context: {
        unitId: "install_1",
        previous: null,
        sequence: 1,
        now: new Date("2024-01-01T18:20:30Z"),
      },
      recorded: { answers: [AEAT_ANSWER] },
      expect: {
        hash: HUELLA_1,
        portFree: true,
        qr: "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=89890001K&numserie=12345678%2FG33&fecha=01-01-2024&importe=123.45",
        payload: [
          "<sum1:PrimerRegistro>S</sum1:PrimerRegistro>",
          "<sum1:FechaHoraHusoGenRegistro>2024-01-01T19:20:30+01:00</sum1:FechaHoraHusoGenRegistro>",
          `<sum1:TipoHuella>01</sum1:TipoHuella><sum1:Huella>${HUELLA_1}</sum1:Huella>`,
          `xmlns:sum="${AEAT_STATIC}/SuministroLR.xsd"`,
        ],
        outcome: FiscalRecordStatus.Accepted,
      },
    },
    {
      id: "verifactu.huella-chained",
      authority: "AEAT VERI*FACTU (Spain)",
      source:
        "AEAT, Detalle de las especificaciones técnicas para generación de la huella o hash, example 2 " +
        "(record chained to example 1)",
      driver: (ports) => new VerifactuDriver(ports.transport),
      options: VERIFACTU,
      document: document("EUR", 11_110, 1235, "21", {
        number: "12345679/G34",
        issuedAt: new Date("2024-01-01T09:00:00Z"),
        seller: AEAT_SELLER,
        buyer: null,
      }),
      context: {
        unitId: "install_1",
        previous: fiscalRecord({
          unitId: "install_1",
          driver: "verifactu",
          documentNumber: "12345678/G33",
          hash: HUELLA_1,
          marks: { issueDate: "01-01-2024" },
        }),
        sequence: 2,
        now: new Date("2024-01-01T18:20:35Z"),
      },
      recorded: { answers: [AEAT_ANSWER] },
      expect: {
        hash: HUELLA_2,
        portFree: true,
        payload: [
          `<sum1:RegistroAnterior><sum1:IDEmisorFactura>89890001K</sum1:IDEmisorFactura><sum1:NumSerieFactura>12345678/G33</sum1:NumSerieFactura><sum1:FechaExpedicionFactura>01-01-2024</sum1:FechaExpedicionFactura><sum1:Huella>${HUELLA_1}</sum1:Huella></sum1:RegistroAnterior>`,
        ],
        outcome: FiscalRecordStatus.Accepted,
      },
    },
    {
      id: "tse.dsfinv-k-qr",
      authority: "KassenSichV TSE (Germany)",
      source:
        "DSFinV-K, Anhang I (process data Kassenbeleg-V1) and the DFKA/BSI receipt QR code specification " +
        "(V0, twelve fields)",
      driver: (ports) => new TseDriver(ports.device),
      options: {
        processType: "Kassenbeleg-V1",
        vatRateSlots: { "19": 1, "7": 2, "10.7": 3, "5.5": 4, "0": 5 },
        paymentTypes: { cash: "Bar", card: "Unbar" },
        homeCurrency: "EUR",
      },
      document: document("EUR", 238, 17, "7", { kind: FiscalDocumentKind.Simplified, buyer: null }),
      context: {
        unitId: "955002-00",
        previous: null,
        sequence: 1,
        now: new Date("2019-07-10T18:41:04Z"),
      },
      recorded: {
        device: {
          "tse.transaction": {
            transactionNumber: 18,
            signatureCounter: 112,
            signature: "MEUCIQDrecordedSampleSignature0000000000000000000000000000000000==",
            startTime: "2019-07-10T18:41:04.000Z",
            endTime: "2019-07-10T18:41:04.000Z",
            serialNumber: "recorded-tse-serial",
            signatureAlgorithm: "ecdsa-plain-SHA256",
            timeFormat: "utcTime",
            publicKey: "BHhWrecordedSamplePublicKey00000000000000000000000000000000000000000==",
          },
        },
      },
      expect: {
        qr:
          "V0;955002-00;Kassenbeleg-V1;Beleg^0.00_2.55_0.00_0.00_0.00^2.55:Bar;18;112;" +
          "2019-07-10T18:41:04.000Z;2019-07-10T18:41:04.000Z;ecdsa-plain-SHA256;utcTime;" +
          "MEUCIQDrecordedSampleSignature0000000000000000000000000000000000==;" +
          "BHhWrecordedSamplePublicKey00000000000000000000000000000000000000000==",
        payload: ["Beleg^0.00_2.55_0.00_0.00_0.00^2.55:Bar"],
      },
    },
    {
      id: "rksv.start-receipt",
      authority: "RKSV (Austria)",
      source:
        "Registrierkassensicherheitsverordnung, Anlage (Detailspezifikation): machine-readable code fields, " +
        "Sig-Voriger-Beleg of the start receipt (SHA-256 of the cash register id, first 8 bytes), JWS ES256",
      driver: (ports) => new RksvDriver(ports.signer, ports.cipher, ports.credentials),
      options: {
        providerId: "AT0",
        rateBuckets: {
          "20": "normal",
          "10": "reduced1",
          "13": "reduced2",
          "0": "zero",
          "19": "special",
        },
        timeZone: "Europe/Vienna",
      },
      document: document("EUR", 1000, 200, "20", {
        number: "83810",
        kind: FiscalDocumentKind.Simplified,
        issuedAt: new Date("2016-03-11T03:24:44Z"),
        buyer: null,
      }),
      context: {
        unitId: "DEMO-CASH-BOX817",
        previous: null,
        sequence: 1,
        now: new Date("2016-03-11T03:24:44Z"),
      },
      recorded: {
        credentials: [
          {
            unitId: "DEMO-CASH-BOX817",
            stage: "production",
            requestId: null,
            token: null,
            secret: null,
            certificate: "recorded-certificate",
            certificateSerial: "5c7a5d3b",
          },
        ],
      },
      expect: {
        // The cipher fake's stand-in is base64 of "<unit>:<receipt>:<turnover>"; the chain seed is the spec's.
        qrContains: [
          "_R1-AT0_DEMO-CASH-BOX817_83810_2016-03-11T04:24:44_12,00_0,00_0,00_0,00_0,00_" +
            "REVNTy1DQVNILUJPWDgxNzo4MzgxMDoxMjAw_5c7a5d3b_d3YUbS4CoRo=_",
        ],
        payload: ["eyJhbGciOiJFUzI1NiJ9."],
      },
    },
    {
      id: "eta-receipt.first-receipt",
      authority: "ETA e-receipt (Egypt)",
      source:
        "ETA e-Receipt integration guide: receipt v1.2, UUID = SHA-256 of the serialized receipt with an empty uuid, " +
        "previousUUID empty on a POS's first receipt, receipt share URL",
      driver: (ports) => new EtaReceiptDriver(ports.transport, ports.credentials),
      options: {
        submitUrl: "https://api.preprod.invoicing.eta.gov.eg/api/v1/receiptsubmissions",
        statusUrl: "https://api.preprod.invoicing.eta.gov.eg/api/v1/receipts/{uuid}/details",
        shareUrl: "https://preprod.invoicing.eta.gov.eg/receipts/search",
        typeVersion: "1.2",
        activityCode: "4620",
        reportingCurrency: "EGP",
        taxTypes: { S: { taxType: "T1", subType: "V009" } },
        paymentMethods: { cash: "C" },
      },
      document: document("EGP", 10_000, 1400, "14", {
        number: "R-0001",
        kind: FiscalDocumentKind.Simplified,
        issuedAt: new Date("2026-03-01T09:30:00Z"),
        seller: { ...ZATCA_SELLER, name: "Sample Store", taxId: "100000000" },
        buyer: null,
      }),
      context: {
        unitId: "pos_1",
        previous: null,
        sequence: 1,
        now: new Date("2026-03-01T09:30:00Z"),
      },
      recorded: {
        credentials: [
          {
            unitId: "pos_1",
            stage: "production",
            requestId: null,
            token: null,
            secret: null,
            certificate: null,
            certificateSerial: null,
            attributes: { [OnboardingInput.DeviceSerial]: "SN-0001" },
          },
        ],
      },
      expect: {
        payload: [
          '"previousUUID":""',
          '"receiptType":"S","typeVersion":"1.2"',
          '"deviceSerialNumber":"SN-0001"',
        ],
        qrContains: [
          "https://preprod.invoicing.eta.gov.eg/receipts/search/",
          "/share/2026-03-01T09:30:00Z#Total:114,IssuerRIN:100000000",
        ],
      },
    },
  ];
}

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/fiscal (the port fakes and the document and record
 *          fixtures) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: test helpers only; no runtime entry imports this one. Needs the optional peer @stackra/testing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { FiscalDeviceFake } from "#testing/fiscal-device.fake";
export { fiscalDocument } from "#testing/fiscal-document.fixture";
export { fiscalRecord } from "#testing/fiscal-record.fixture";
export { FiscalPackSourceFake } from "#testing/fiscal-pack-source.fake";
export { FiscalSignerFake } from "#testing/fiscal-signer.fake";
export { FiscalTransportFake } from "#testing/fiscal-transport.fake";
export { HybridPdfFake } from "#testing/hybrid-pdf.fake";
export { TillCredentialsFake } from "#testing/till-credentials.fake";
export { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

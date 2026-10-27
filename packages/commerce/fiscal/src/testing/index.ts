/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/fiscal (the port fakes, the document and record
 *          fixtures, and the certification harness with its recorded authority cases) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: test helpers only; no runtime entry imports this one. Needs the optional peer @stackra/testing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { CertificationCase } from "#testing/certification-case.type";
export type { CertificationPorts } from "#testing/certification-ports.type";
export type { CertificationResult } from "#testing/certification-result.type";
export type { CertificationSandbox } from "#testing/certification-sandbox.type";
export { certificationCases } from "#testing/certification-cases.fixture";
export { FiscalDeviceFake } from "#testing/fiscal-device.fake";
export { fiscalDocument } from "#testing/fiscal-document.fixture";
export { fiscalRecord } from "#testing/fiscal-record.fixture";
export { FiscalPackSourceFake } from "#testing/fiscal-pack-source.fake";
export { FiscalSignerFake } from "#testing/fiscal-signer.fake";
export { FiscalSigningKeyFake } from "#testing/fiscal-signing-key.fake";
export { FiscalTransportFake } from "#testing/fiscal-transport.fake";
export { HybridPdfFake } from "#testing/hybrid-pdf.fake";
export { runCertification } from "#testing/run-certification.function";
export { TillCredentialsFake } from "#testing/till-credentials.fake";
export { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

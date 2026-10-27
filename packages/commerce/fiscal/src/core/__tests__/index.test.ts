/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the service, the onboarding, the drivers (each with its pack key),
 *          the memory journal, the refusals and the option schemas are its values, and the format helpers stay
 *          internal.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { HybridPdfFake } from "#testing/hybrid-pdf.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";
import { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

describe("@stackra/fiscal", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "DeviceOnboardingDriver",
      "ETA_ONBOARDING_OPTIONS",
      "ETA_OPTIONS",
      "ETA_RECEIPT_OPTIONS",
      "EtaDriver",
      "EtaOnboardingDriver",
      "EtaReceiptDriver",
      "FACTUR_X_OPTIONS",
      "FDM_OPTIONS",
      "FacturXDriver",
      "FdmDriver",
      "FiscalAuthorityUnavailableError",
      "FiscalChainConflictError",
      "FiscalCredentialMissingError",
      "FiscalDocumentInvalidError",
      "FiscalDriverMissingError",
      "FiscalOnboardingInputMissingError",
      "FiscalOnboardingRefusedError",
      "FiscalOnboardingService",
      "FiscalOnboardingUnsupportedError",
      "FiscalOptionsInvalidError",
      "FiscalService",
      "FiscalSignatureUnsupportedError",
      "MarketPackFiscalPackSourceDriver",
      "MemoryFiscalDriver",
      "MemoryFiscalJournalDriver",
      "NF525_OPTIONS",
      "Nf525Driver",
      "PEPPOL_OPTIONS",
      "PeppolDriver",
      "RKSV_OPTIONS",
      "RT_OPTIONS",
      "RksvDriver",
      "RtDriver",
      "TSE_OPTIONS",
      "TseDriver",
      "VERIFACTU_OPTIONS",
      "VerifactuDriver",
      "XadesEnvelopeSignerDriver",
      "ZATCA_OPTIONS",
      "ZatcaDriver",
      "ZatcaOnboarding",
    ]);
  });

  it("gives every driver the key a pack names it by", () => {
    const signer = new FiscalSignerFake();
    const transport = FiscalTransportFake.answering();
    const device = FiscalDeviceFake.with({});
    const keys = [
      new core.ZatcaDriver(signer, transport),
      new core.EtaDriver(signer, transport),
      new core.PeppolDriver(transport),
      new core.FacturXDriver(transport, new HybridPdfFake()),
      new core.TseDriver(device),
      new core.Nf525Driver(signer),
      new core.FdmDriver(device),
      new core.RtDriver(device),
      new core.RksvDriver(signer, new TurnoverCipherFake(), new TillCredentialsFake()),
      new core.VerifactuDriver(transport),
      new core.EtaReceiptDriver(transport, new TillCredentialsFake()),
      new core.MemoryFiscalDriver(),
    ].map((driver) => driver.key);
    expect(keys).toEqual([
      "zatca",
      "eta",
      "peppol",
      "factur-x",
      "tse",
      "nf525",
      "fdm",
      "rt",
      "rksv",
      "verifactu",
      "eta-receipt",
      "memory",
    ]);
  });
});

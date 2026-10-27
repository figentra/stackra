/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: its ports and enums are exported, nothing else is, and `.`
 *          exports none of them.
 * Boundary: test only; imports the stand-in barrels through their `#contracts` and `#core` aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import * as core from "#core/index";

describe("@stackra/integrations/contracts", () => {
  it("exports exactly its ports and enums", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AudioDevice",
      "AudioEncoding",
      "CallStatus",
      "ChannelPaymentMethod",
      "CmsSigner",
      "ConnectionContext",
      "EdiDocumentType",
      "FraudDecision",
      "ManagedProvisioning",
      "MarketContext",
      "MobileStore",
      "PayInputKind",
      "ProviderDefaults",
      "ProviderMode",
      "ProviderSource",
      "ProvisioningStatus",
      "RecordingConsent",
      "RegionMapSource",
    ]);
  });

  it("is the only entry that exports them", () => {
    for (const name of Object.keys(contracts)) expect(name in core).toBe(false);
  });
});

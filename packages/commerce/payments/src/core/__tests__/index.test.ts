/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the two services, the four drivers, the refusals and the helpers are its
 *          values; no vendor Integration or Connection (they live in the OS integrations service) and nothing internal
 *          leaks.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/payments", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "CapabilityUnsupportedError",
      "ConnectionPaymentGatewaysDriver",
      "InvalidPaymentTransitionError",
      "MemoryPaymentRecordsDriver",
      "MemoryRestrictedTenderProgramsDriver",
      "MemoryTenderEligibilityDriver",
      "MerchantInitiatedNotAllowedError",
      "NoEligibleLinesError",
      "NoPaymentProviderError",
      "PaymentDeclinedError",
      "PaymentFieldRequiredError",
      "PaymentService",
      "PaymentUnknownError",
      "PayoutHeldError",
      "PreVerificationCapExceededError",
      "ResolutionReasonRequiredError",
      "RestrictedTenderService",
      "RestrictedTenderUnavailableError",
      "hasCapability",
      "modeOf",
      "splitTender",
      "totalOf",
    ]);
  });
});

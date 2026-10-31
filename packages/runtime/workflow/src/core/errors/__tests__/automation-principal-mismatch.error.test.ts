/**
 * Stackra file contract:
 * Purpose: unit tests of `AutomationPrincipalMismatchError`: a non-retryable Forbidden refusal with code
 *          `automation_principal_mismatch` that carries the automation id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AutomationPrincipalMismatchError } from "#core/errors/automation-principal-mismatch.error";

describe("AutomationPrincipalMismatchError", () => {
  it("is a Forbidden refusal with code automation_principal_mismatch and the automation id", () => {
    const refused = AutomationPrincipalMismatchError.create({ automationId: "wfa_1" });
    expect(isRefusal(refused, AutomationPrincipalMismatchError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused.code).toBe("automation_principal_mismatch");
    expect(refused.retryable).toBe(false);
    expect(refused.automationId).toBe("wfa_1");
  });
});

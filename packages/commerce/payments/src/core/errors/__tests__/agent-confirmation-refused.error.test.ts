/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentConfirmationRefusedError`: a forbidden refusal with its code, not retryable, carrying the
 *          reference, protocol and reason.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0446.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AgentConfirmationRefusedError } from "#core/errors/agent-confirmation-refused.error";

describe("AgentConfirmationRefusedError", () => {
  it("is a forbidden refusal carrying the reference, protocol and reason", () => {
    const refusal = AgentConfirmationRefusedError.create({
      reference: "cart_1",
      protocol: "acp",
      reason: "expired",
    });
    expect(isRefusal(refusal, AgentConfirmationRefusedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Forbidden);
    expect(refusal.code).toBe("agent_confirmation_refused");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ reference: "cart_1", protocol: "acp", reason: "expired" });
  });
});

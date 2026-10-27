/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardrailBlockedError`: a Forbidden refusal with code `guardrail_blocked` that names the
 *          layer, the stage and the reason code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; STA-1385.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { GuardrailBlockedError } from "#core/errors/guardrail-blocked.error";

describe(GuardrailBlockedError, () => {
  it("is a Forbidden refusal with code guardrail_blocked naming the layer, stage and reason", () => {
    const refused = GuardrailBlockedError.create({
      guardrail: "injection",
      stage: "input",
      reason: "prompt_injection",
    });
    expect(isRefusal(refused, GuardrailBlockedError)).toBe(true);
    expect(refused.code).toBe("guardrail_blocked");
    expect(refused.retryable).toBe(false);
    expect(refused.kind).toBe(ErrorKind.Forbidden);
    expect(refused).toMatchObject({
      guardrail: "injection",
      stage: "input",
      reason: "prompt_injection",
    });
  });
});

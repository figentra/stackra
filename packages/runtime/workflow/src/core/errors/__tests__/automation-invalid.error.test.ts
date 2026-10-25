/**
 * Stackra file contract:
 * Purpose: unit tests of the automation refusals: `AutomationInvalidError` (400, field errors), `AutomationChangedError`
 *          (409, retryable, names the automation) and `AutomationNotDryRunError` (a failed precondition naming the
 *          automation and the revision).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0122 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AutomationChangedError } from "#core/errors/automation-changed.error";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { AutomationNotDryRunError } from "#core/errors/automation-not-dry-run.error";

const automationId = "wfa_01j9z3k4m5n6p7q8r9s0t1v2w1" as PublicId<"wfa">;

describe("AutomationInvalidError", () => {
  it("is a 400 with the refused paths as field errors", () => {
    const fieldErrors = { "steps.0.block": "block_unknown" };
    const refused = AutomationInvalidError.create({}, { fieldErrors });
    expect(isRefusal(refused, AutomationInvalidError)).toBe(true);
    expect(refused.code).toBe("automation_invalid");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
    expect(refused.toEnvelope()).toMatchObject({ fieldErrors });
  });

  it("is joined by the changed and not-dry-run refusals", () => {
    const changed = AutomationChangedError.create({ automationId });
    expect(changed.code).toBe("automation_changed");
    expect(changed.retryable).toBe(true);
    expect(changed.automationId).toBe(automationId);
    const early = AutomationNotDryRunError.create({ automationId, revision: 3 });
    expect(early.code).toBe("automation_not_dry_run");
    expect(early.kind).toBe(ErrorKind.FailedPrecondition);
    expect(early.revision).toBe(3);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `WorkflowTimedOutError`: a refusal of kind `Unavailable` with code `workflow_timed_out`, category `unavailable` (HTTP 503),
 *          retryable, carrying no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ErrorKind } from "#core/enums/error-kind.enum";
import { WorkflowTimedOutError } from "#core/errors/workflow-timed-out.error";
import { isRefusal } from "#core/functions/is-refusal.function";

describe("WorkflowTimedOutError", () => {
  it("is a Unavailable refusal with code workflow_timed_out", () => {
    const refused = WorkflowTimedOutError.create();
    expect(isRefusal(refused, WorkflowTimedOutError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Unavailable);
    expect(refused.code).toBe("workflow_timed_out");
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(503);
  });

  it("has the envelope of ADR 0140 with no details", () => {
    expect(WorkflowTimedOutError.envelope()).toEqual({
      code: "workflow_timed_out",
      category: "unavailable",
      retryable: true,
    });
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `findErrorCode`: a code as printed, in another case or with `-` for `_`; a check finding
 *          copied as `<tool>/<rule>` (`repo-checks/imports`, `gen/stale`) found by its rule; a tool prefix never
 *          reaching a gen code; and an unknown rule found nowhere.
 * Boundary: test only; reads the committed catalogue.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2891.
 */
import { describe, expect, it } from "@stackra/testing";

import { findErrorCode } from "#node/explain/functions/find-error-code.function";

describe("findErrorCode", () => {
  it("finds a code as printed, in another case or with - for _", () => {
    expect(findErrorCode("shape_number_kind")?.code).toBe("shape_number_kind");
    expect(findErrorCode(" runwaylockederror ")?.code).toBe("RunwayLockedError");
    expect(findErrorCode("shape-number-kind")?.code).toBe("shape_number_kind");
  });

  it("finds a stackra check finding written as <tool>/<rule>", () => {
    expect(findErrorCode("repo-checks/imports")).toMatchObject({ code: "imports", tool: "check" });
    expect(findErrorCode("gen/stale")).toMatchObject({ code: "stale", tool: "check" });
    expect(findErrorCode("cspell/unknown-word")?.code).toBe("unknown-word");
  });

  it("reaches only a check rule through a tool prefix", () => {
    expect(findErrorCode("oxlint/shape_number_kind")).toBeUndefined();
    expect(findErrorCode("repo-checks/no-such-rule")).toBeUndefined();
    expect(findErrorCode("repo-checks/")).toBeUndefined();
  });
});

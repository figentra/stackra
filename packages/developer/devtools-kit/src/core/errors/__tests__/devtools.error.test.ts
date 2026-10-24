/**
 * Stackra file contract:
 * Purpose: unit tests of `DevtoolsError`: it is an `Error` named `DevtoolsError` carrying its code and message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0246.
 */
import { describe, expect, it } from "@stackra/testing";

import { DevtoolsError } from "#core/errors/devtools.error";

describe(DevtoolsError, () => {
  it("carries its code, name and message", () => {
    const error = new DevtoolsError("unknown_tab", 'no devtools tab "router.tree"');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DevtoolsError");
    expect(error.code).toBe("unknown_tab");
    expect(error.message).toBe('no devtools tab "router.tree"');
  });
});

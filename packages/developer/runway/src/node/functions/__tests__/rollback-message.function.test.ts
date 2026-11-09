/**
 * Stackra file contract:
 * Purpose: unit tests of `rollbackMessage`: the deployment message a promote records names the commit it rolls back
 *          to.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { describe, expect, it } from "@stackra/testing";

import { rollbackMessage } from "#node/functions/rollback-message.function";

describe("rollbackMessage", () => {
  it("names the commit", () => {
    expect(rollbackMessage("0123abc")).toBe("rollback to 0123abc");
  });
});

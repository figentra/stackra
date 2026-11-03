/**
 * Stackra file contract:
 * Purpose: unit tests of `CliUsageError`: a console `UsageError` (so a native command exits 2 on it) with its own name
 *          and the given message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { UsageError } from "@stackra/console";
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";

describe("CliUsageError", () => {
  it("is a named console UsageError carrying the message", () => {
    const error = new CliUsageError("unknown tier: load");
    expect(error).toBeInstanceOf(UsageError);
    expect(error.name).toBe("CliUsageError");
    expect(error.message).toBe("unknown tier: load");
  });
});

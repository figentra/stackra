/**
 * Stackra file contract:
 * Purpose: unit tests of `CliUsageError`: the console's `UsageError` with its own name and the given message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { UsageError } from "@stackra/console";

import { CliUsageError } from "#node/errors/cli-usage.error";

describe("CliUsageError", () => {
  it("is a named UsageError carrying the message, so a native command exits 2", () => {
    const error = new CliUsageError("unknown tier: load");
    expect(error).toBeInstanceOf(UsageError);
    expect(error.name).toBe("CliUsageError");
    expect(error.message).toBe("unknown tier: load");
  });
});

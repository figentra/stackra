/**
 * Stackra file contract:
 * Purpose: unit tests of `CliUsageError`: a console `UsageError` (so a native command exits 2 on it) named `UsageError`
 *          (so `--json` reports code `usage`) with the given message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { UsageError } from "@stackra/console";
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";

describe("CliUsageError", () => {
  it("is a console UsageError, named UsageError, carrying the message", () => {
    const error = new CliUsageError("unknown tier: load");
    expect(error).toBeInstanceOf(UsageError);
    expect(error.name).toBe("UsageError");
    expect(error.message).toBe("unknown tier: load");
  });
});

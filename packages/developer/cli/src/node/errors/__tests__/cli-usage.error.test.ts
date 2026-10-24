/**
 * Stackra file contract:
 * Purpose: unit tests of `CliUsageError`: a plain `Error` with its own name and the given message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";

describe("CliUsageError", () => {
  it("is a named Error carrying the message", () => {
    const error = new CliUsageError("unknown tier: load");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("CliUsageError");
    expect(error.message).toBe("unknown tier: load");
  });
});

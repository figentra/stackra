/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryErrorReporterDriver`: it is the `ErrorReporter` port and keeps each reported error in
 *          order until `clear()`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0232 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";
import { MemoryErrorReporterDriver } from "#core/drivers/memory-error-reporter.driver";

describe(MemoryErrorReporterDriver, () => {
  it("keeps every reported error until cleared", () => {
    const reporter = new MemoryErrorReporterDriver();
    expect(reporter).toBeInstanceOf(ErrorReporter);
    const first = new Error("first");
    reporter.report(first);
    reporter.report("second");
    expect(reporter.errors).toEqual([first, "second"]);
    reporter.clear();
    expect(reporter.errors).toEqual([]);
  });
});

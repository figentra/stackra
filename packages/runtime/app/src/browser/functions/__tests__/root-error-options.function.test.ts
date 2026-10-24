/**
 * Stackra file contract:
 * Purpose: unit tests of `rootErrorOptions`: both callbacks hand the error to the reporter, once each.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0232 (decision 8).
 */
import { Driver } from "@stackra/container";
import { ErrorReporter } from "@stackra/errors/contracts";
import { describe, expect, it } from "@stackra/testing";

import { rootErrorOptions } from "#browser/functions/root-error-options.function";

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  readonly errors: unknown[] = [];

  report(error: unknown): void {
    this.errors.push(error);
  }
}

describe("rootErrorOptions", () => {
  it("reports caught and uncaught render errors once each", () => {
    const reporter = new MemoryErrorReporterDriver();
    const options = rootErrorOptions(reporter);
    const caught = new Error("caught");
    const uncaught = new Error("uncaught");
    options.onCaughtError(caught, { componentStack: "" });
    options.onUncaughtError(uncaught, { componentStack: "" });
    expect(reporter.errors).toEqual([caught, uncaught]);
  });
});

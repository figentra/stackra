/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsoleErrorReporterDriver`: it is an `ErrorReporter`, writes the error as it is to
 *          `console.error`, and does not throw when the console does.
 * Boundary: test only; spies on the console.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0232 (decision 8).
 */
import { ErrorReporter } from "@stackra/errors/contracts";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";

describe("ConsoleErrorReporterDriver", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is an ErrorReporter", () => {
    expect(new ConsoleErrorReporterDriver()).toBeInstanceOf(ErrorReporter);
  });

  it("writes the error to console.error", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("boom");
    new ConsoleErrorReporterDriver().report(error);
    expect(write).toHaveBeenCalledWith(error);
  });

  it("never throws, even when the console does", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console gone");
    });
    expect(() => new ConsoleErrorReporterDriver().report(new Error("boom"))).not.toThrow();
  });
});

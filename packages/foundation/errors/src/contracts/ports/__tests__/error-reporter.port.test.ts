/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ErrorReporter` port: an abstract class that extends `Port`, carries the port
 *          brand, is implemented by `Driver(ErrorReporter)`, and is a container token a test can override.
 * Boundary: test only; the driver here is a test-local memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0232 (decision 8);
 *                     ADR 0294 (decisions 16 and 17).
 */
import { Container, Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  readonly errors: unknown[] = [];

  report(error: unknown): void {
    this.errors.push(error);
  }
}

describe("ErrorReporter", () => {
  it("is an abstract port", () => {
    expect(new MemoryErrorReporterDriver()).toBeInstanceOf(Port);
    expect(new MemoryErrorReporterDriver()).toBeInstanceOf(ErrorReporter);
    expectTypeOf<ErrorReporter["~kind"]>().toEqualTypeOf<"port">();
    // @ts-expect-error -- a port is abstract
    const direct = new ErrorReporter();
    expect(direct).toBeInstanceOf(Port);
  });

  it("makes a driver implement report", () => {
    // @ts-expect-error -- report is abstract and not implemented
    class EmptyDriver extends Driver(ErrorReporter) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("is a container token", async () => {
    const reporter = new MemoryErrorReporterDriver();
    const container = await Container.create([], {
      overrides: new Map([[ErrorReporter, reporter]]),
    });
    const error = new TypeError("x is undefined");
    container.get(ErrorReporter).report(error);
    expect(reporter.errors).toEqual([error]);
  });
});

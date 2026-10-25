/**
 * Stackra file contract:
 * Purpose: unit tests of `useErrorReporter()`: the returned function reports to the container's `ErrorReporter`, and
 *          the hook throws outside a `ContainerProvider` and when no reporter is bound, so a missing reporter is never
 *          a silent drop.
 * Boundary: test only; renders with react-dom/server (no DOM needed) and calls the reporter during render only to
 *           observe it, which components must not do.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0232 (decision 8).
 */
import { Container, Driver } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";
import { useErrorReporter } from "#react/error-reporter/use-error-reporter";

class MemoryErrorReporterDriver extends Driver(ErrorReporter) {
  readonly errors: unknown[] = [];

  report(error: unknown): void {
    this.errors.push(error);
  }
}

/** Reports `error` with the hook's function. */
function Reporting({ error }: { readonly error: unknown }) {
  useErrorReporter()(error);
  return null;
}

describe("useErrorReporter", () => {
  it("reports to the ErrorReporter of the nearest container", async () => {
    const reporter = new MemoryErrorReporterDriver();
    const container = await Container.create([], {
      overrides: new Map([[ErrorReporter, reporter]]),
    });
    const error = new TypeError("x is undefined");
    renderToString(
      <ContainerProvider container={container}>
        <Reporting error={error} />
      </ContainerProvider>,
    );
    expect(reporter.errors).toEqual([error]);
    expectTypeOf(useErrorReporter).returns.toEqualTypeOf<(error: unknown) => void>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Reporting error={new Error("x")} />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container binds no ErrorReporter", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Reporting error={new Error("x")} />
        </ContainerProvider>,
      ),
    ).toThrow();
  });
});

/**
 * Stackra file contract:
 * Purpose: `rootErrorOptions`, the React root callbacks every browser root is created with, so each render error React
 *          catches in a boundary or misses entirely reaches the reporter once.
 * Boundary: reports only; the boundary still renders the error page. Not exported.
 * Runtime: browser
 * Governing contract: ADR 0232 (decision 8: report once); ADR 0295 (decision 8).
 */
import type { ErrorReporter } from "@stackra/errors/contracts";
import type { RootOptions } from "react-dom/client";

/**
 * The root callbacks that report to `reporter`.
 *
 * @example
 * createRoot(element, rootErrorOptions(reporter));
 */
export function rootErrorOptions(reporter: ErrorReporter): {
  readonly onCaughtError: NonNullable<RootOptions["onCaughtError"]>;
  readonly onUncaughtError: NonNullable<RootOptions["onUncaughtError"]>;
} {
  return {
    onCaughtError: (error) => reporter.report(error),
    onUncaughtError: (error) => reporter.report(error),
  };
}

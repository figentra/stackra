/**
 * Stackra file contract:
 * Purpose: `useErrorReporter()`, the hook a component reports an unexpected error with: it returns a stable
 *          `report(error)` bound to the `ErrorReporter` of the nearest container.
 * Boundary: resolves the port from the container (`useContainer` throws outside a `ContainerProvider`, and an unbound
 *           port throws `UnresolvedPortError`), so a missing reporter is a boot or test failure, never a silent drop.
 *           Call the returned function after commit (in an effect or a handler), never during render.
 * Runtime: isomorphic
 * Governing contract: ADR 0232 (decisions 4 and 8), ADR 0294 (decision 17), ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";
import { useCallback } from "react";

import { ErrorReporter } from "#contracts/ports/error-reporter.port";

/**
 * The `report(error)` of the container's `ErrorReporter`; the same function across renders while the reporter is.
 *
 * @example
 * report = useErrorReporter();
 * useEffect(() => {
 *   if (!isRefusal(error)) this.report(error);
 * }, [error, this.report]);
 */
export function useErrorReporter(): (error: unknown) => void {
  const reporter = useContainer().get(ErrorReporter);
  return useCallback((error: unknown) => reporter.report(error), [reporter]);
}

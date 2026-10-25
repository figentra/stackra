/**
 * Stackra file contract:
 * Purpose: `useAnalytics()`, the hook a component, a class component's field or a component's own hook reads the
 *          analytics client with: `useAnalytics().track(BarcodeScanned.create({ found: true }))`.
 * Boundary: resolves the `AnalyticsClient` of the nearest container, the same instance on every render, so it is a
 *           stable effect dependency. Consent stays inside the client: a caller tracks without checking it. Throws
 *           outside a `ContainerProvider` or when the container does not bind the client, so a missing analytics
 *           context is never a silent send.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";

import { AnalyticsClient } from "#core/index";

/**
 * The analytics client of the nearest container.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `AnalyticsClient`.
 * @example
 * const analytics = useAnalytics();
 * useEffect(() => {
 *   if (sent) analytics.track(LeadSubmitted.create({ plan }));
 * }, [sent, plan, analytics]);
 */
export function useAnalytics(): AnalyticsClient {
  return useContainer().get(AnalyticsClient);
}

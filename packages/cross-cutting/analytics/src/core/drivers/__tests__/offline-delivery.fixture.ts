/**
 * Stackra file contract:
 * Purpose: `deliveryNamed(name)`, the envelope v2 deliveries the offline queue driver tests keep and load.
 * Boundary: test fixture only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decision 5).
 */
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";

/** A delivery named `name`. */
export function deliveryNamed(name: string): AnalyticsDelivery {
  return {
    eventId: `evt_${name}`,
    kind: "track",
    name,
    properties: { plan: "pro" },
    occurredAt: "2026-10-28T09:00:00.000Z",
    anonymousId: "anon_1",
    sessionId: "ses_1",
    context: { library: { name: "@stackra/analytics" } },
  };
}

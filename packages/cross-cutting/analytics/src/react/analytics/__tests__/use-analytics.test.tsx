/**
 * Stackra file contract:
 * Purpose: unit tests of `useAnalytics`: it returns the `AnalyticsClient` the nearest container binds, the same
 *          instance across renders (a stable effect dependency, as the template's contact page uses it), a tracked
 *          event waits for consent inside it, and it throws outside a provider.
 * Boundary: test only; renders through Testing Library (jsdom) with a container whose client is the analytics fake.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0298 (decision 5); ADR 0295 (decision 10).
 */
// @vitest-environment jsdom
import { ConsentCategory } from "@stackra/consent";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { AnalyticsEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { z } from "zod";

import { AnalyticsClient } from "#core/index";
import { useAnalytics } from "#react/analytics/use-analytics";
import { fakeAnalytics } from "#testing/functions/fake-analytics.function";

/** The template's scanner event. */
class BarcodeScanned extends AnalyticsEvent({ name: "scan.barcode_scanned" }) {
  found!: boolean;
}

registerSchemas([[BarcodeScanned, z.object({ found: z.boolean() })]]);

/** A wrapper whose container binds `client` as the `AnalyticsClient`. */
async function wrapperFor(client: AnalyticsClient) {
  const container = await Container.create([], { overrides: new Map([[AnalyticsClient, client]]) });
  return ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

describe("useAnalytics", () => {
  it("returns the container's client, the same instance on every render", async () => {
    const analytics = fakeAnalytics();
    const { result, rerender } = renderHook(() => useAnalytics(), {
      wrapper: await wrapperFor(analytics),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(analytics);
    expect(result.current).toBe(first);
  });

  it("tracks through the client, which waits for consent", async () => {
    const analytics = fakeAnalytics();
    const { result } = renderHook(() => useAnalytics(), { wrapper: await wrapperFor(analytics) });
    result.current.track(BarcodeScanned.create({ found: true }));
    expect(analytics.tracked).toEqual([BarcodeScanned.create({ found: true })]);
    expect(analytics.delivered()).toEqual([]);
    analytics.consent.set(ConsentCategory.Analytics, true);
    expect(analytics.delivered().map((delivery) => delivery.name)).toEqual([
      "scan.barcode_scanned",
    ]);
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderHook(() => useAnalytics())).toThrow(/ContainerProvider/);
  });
});

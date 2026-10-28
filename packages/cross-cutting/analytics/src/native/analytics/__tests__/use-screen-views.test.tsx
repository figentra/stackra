/**
 * Stackra file contract:
 * Purpose: unit tests of `useScreenViews`: one screen view per screen change while `autocapturePageviews` is on, a
 *          repeat and an empty name skipped, nothing while it is off.
 * Boundary: test only; renders the hook through Testing Library with a container whose client is the analytics fake.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0298 (decision 5); analytics gap 9 (stackra-409).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { type AnyClass, Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { AnalyticsClient, AnalyticsConfig, ScreenViewed } from "#core/index";
import { useScreenViews } from "#native/analytics/use-screen-views";
import { fakeAnalytics } from "#testing/functions/fake-analytics.function";

/** A fake client and a wrapper over a container with `autocapturePageviews` set to `on`. */
async function setUp(on: boolean) {
  const analytics = fakeAnalytics();
  const container = await Container.create([], {
    overrides: new Map<AnyClass, object>([
      [AnalyticsClient, analytics],
      [AnalyticsConfig, buildConfig(AnalyticsConfig, { values: { autocapturePageviews: on } })],
    ]),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { analytics, wrapper };
}

describe("useScreenViews", () => {
  it("tracks one screen view per screen change", async () => {
    const { analytics, wrapper } = await setUp(true);
    const { rerender } = renderHook(({ screen }) => useScreenViews(screen), {
      wrapper,
      initialProps: { screen: "" },
    });
    rerender({ screen: "orders.index" });
    rerender({ screen: "orders.index" });
    rerender({ screen: "orders.show" });
    expect(analytics.tracked).toEqual([
      ScreenViewed.create({ screen: "orders.index" }),
      ScreenViewed.create({ screen: "orders.show" }),
    ]);
  });

  it("tracks nothing while page views are off", async () => {
    const { analytics, wrapper } = await setUp(false);
    renderHook(() => useScreenViews("orders.index"), { wrapper });
    expect(analytics.tracked).toEqual([]);
  });
});

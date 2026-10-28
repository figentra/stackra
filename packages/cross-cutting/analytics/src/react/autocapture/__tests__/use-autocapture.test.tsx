/**
 * Stackra file contract:
 * Purpose: unit tests of `useAutocapture`: a page view per path change (query and hash removed, a repeat skipped)
 *          only while `autocapturePageviews` is on, and `data-track` clicks (the name and path only, a bad name
 *          skipped, nothing outside a marked element) only while `autocaptureClicks` is on.
 * Boundary: test only; renders through Testing Library (jsdom) with a container whose client is the analytics fake.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0298 (decision 5); analytics gap 9 (stackra-409).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { type AnyClass, Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { AnalyticsClient, AnalyticsConfig, ElementClicked, PageViewed } from "#core/index";
import { useAutocapture } from "#react/autocapture/use-autocapture";
import { fakeAnalytics } from "#testing/functions/fake-analytics.function";

/** A fake client and a wrapper whose container binds it and a config with `values`. */
async function setUp(values: Partial<ConfigValues<AnalyticsConfig>>) {
  const analytics = fakeAnalytics();
  const container = await Container.create([], {
    overrides: new Map<AnyClass, object>([
      [AnalyticsClient, analytics],
      [AnalyticsConfig, buildConfig(AnalyticsConfig, { values })],
    ]),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
  return { analytics, wrapper };
}

/** Clicks a fresh element made from `html` inside the document. */
function click(html: string, selector: string): void {
  document.body.innerHTML = html;
  document.querySelector<HTMLElement>(selector)?.click();
}

describe("useAutocapture", () => {
  it("tracks one page view per path, without query or hash", async () => {
    const { analytics, wrapper } = await setUp({ autocapturePageviews: true });
    const { rerender } = renderHook(({ path }) => useAutocapture(path), {
      wrapper,
      initialProps: { path: "/orders?page=2" },
    });
    rerender({ path: "/orders#top" });
    rerender({ path: "/pricing" });
    expect(analytics.tracked).toEqual([
      PageViewed.create({ path: "/orders" }),
      PageViewed.create({ path: "/pricing" }),
    ]);
  });

  it("tracks nothing while the switches are off", async () => {
    const { analytics, wrapper } = await setUp({});
    renderHook(() => useAutocapture("/orders"), { wrapper });
    click('<button data-track="checkout.pay">Pay</button>', "button");
    expect(analytics.tracked).toEqual([]);
  });

  it("tracks a click inside a data-track element by its name and path only", async () => {
    const { analytics, wrapper } = await setUp({ autocaptureClicks: true });
    const { unmount } = renderHook(() => useAutocapture("/checkout?step=2"), { wrapper });
    click('<button data-track="checkout.pay"><span>Pay lina@acme.example</span></button>', "span");
    click('<button data-track="Pay now">Pay</button>', "button");
    click("<button>Plain</button>", "button");
    expect(analytics.tracked).toEqual([
      ElementClicked.create({ target: "checkout.pay", path: "/checkout" }),
    ]);
    unmount();
    click('<button data-track="checkout.pay">Pay</button>', "button");
    expect(analytics.tracked).toHaveLength(1);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `BreadcrumbsProvider`, `useBreadcrumb` and `useBreadcrumbs`: published crumbs form the trail
 *          outermost first whatever the mount order, one per href, a crumb leaves the trail with its publisher, and
 *          both hooks are inert outside a provider.
 * Boundary: unit tier, jsdom.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0164; ADR 0303 (decision 1).
 */
// @vitest-environment jsdom
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { BreadcrumbsProvider } from "#react/breadcrumbs/breadcrumbs-provider";
import { useBreadcrumb } from "#react/breadcrumbs/use-breadcrumb";
import { useBreadcrumbs } from "#react/breadcrumbs/use-breadcrumbs";

/** Publishes one crumb. */
function Page({ to, label }: { readonly to: string; readonly label: string }) {
  useBreadcrumb({ to, label: label as I18nKey });
  return null;
}

/** Shows the trail. */
function Trail() {
  return (
    <p>
      {useBreadcrumbs()
        .map((crumb) => crumb.label)
        .join(" > ")}
    </p>
  );
}

afterEach(cleanup);

describe("useBreadcrumbs", () => {
  it("orders the trail by depth and drops a crumb with its page", () => {
    const view = render(
      <BreadcrumbsProvider>
        <Page to="/orders/orders/ord_1" label="order" />
        <Page to="/orders/orders" label="orders" />
        <Page to="/orders/orders" label="orders again" />
        <Trail />
      </BreadcrumbsProvider>,
    );
    expect(screen.getByText("orders again > order")).toBeTruthy();
    view.rerender(
      <BreadcrumbsProvider>
        <Page to="/orders/orders" label="orders" />
        <Trail />
      </BreadcrumbsProvider>,
    );
    expect(screen.getByText("orders")).toBeTruthy();
  });

  it("is inert outside a provider", () => {
    render(
      <>
        <Page to="/" label="home" />
        <Trail />
      </>,
    );
    expect(screen.getByRole("paragraph").textContent).toBe("");
  });
});

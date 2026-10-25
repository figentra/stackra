/**
 * Stackra file contract:
 * Purpose: unit tests of `useBreadcrumb` and `useBreadcrumbs`: published crumbs form the trail outermost first whatever the
 *          mount order, one per href, a crumb leaves the trail with its publisher, and both hooks are inert outside a
 *          shell.
 * Boundary: unit tier, jsdom; the web kit's confirmation provider is a pass-through stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164; ADR 0303 (decision 1).
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { useBreadcrumb } from "#react/breadcrumbs/use-breadcrumb";
import { useBreadcrumbs } from "#react/breadcrumbs/use-breadcrumbs";
import { PanelShell } from "#react/panel-shell/panel-shell";

vi.mock("@stackra/ui/react", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ConfirmationProvider: (props: { readonly children?: never }) =>
      createElement(Fragment, null, props.children),
  };
});

const PANEL = { key: "admin", path: "/", area: ApiArea.Admin };

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
      <PanelShell panel={PANEL}>
        <Page to="/orders/orders/ord_1" label="order" />
        <Page to="/orders/orders" label="orders" />
        <Page to="/orders/orders" label="orders again" />
        <Trail />
      </PanelShell>,
    );
    expect(screen.getByText("orders again > order")).toBeTruthy();
    view.rerender(
      <PanelShell panel={PANEL}>
        <Page to="/orders/orders" label="orders" />
        <Trail />
      </PanelShell>,
    );
    expect(screen.getByText("orders")).toBeTruthy();
  });

  it("is inert outside a shell", () => {
    render(
      <>
        <Page to="/" label="home" />
        <Trail />
      </>,
    );
    expect(screen.getByRole("paragraph").textContent).toBe("");
  });
});

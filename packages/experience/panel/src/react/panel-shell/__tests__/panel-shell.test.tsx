/**
 * Stackra file contract:
 * Purpose: unit tests of `PanelShell` and `usePanel`: the shell shares its panel with the tree under it, holds
 *          navigation's breadcrumb trail for the pages under it, and `usePanel` refuses outside a shell.
 * Boundary: unit tier, jsdom; the web kit's confirmation provider is a pass-through stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164.
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { useBreadcrumb, useBreadcrumbs } from "@stackra/navigation/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { PanelShell } from "#react/panel-shell/panel-shell";
import { usePanel } from "#react/panel-shell/use-panel";

vi.mock("@stackra/ui/react", async () => {
  const { createElement, Fragment } = await import("react");
  return {
    ConfirmationProvider: (props: { readonly children?: never }) =>
      createElement(Fragment, null, props.children),
  };
});

const PANEL = { key: "admin", path: "/", area: ApiArea.Admin };

/** Shows the current panel's key. */
function Probe() {
  return <p>{usePanel().key}</p>;
}

/** Publishes one crumb and shows the trail. */
function CrumbProbe() {
  useBreadcrumb({ to: "/orders", label: "orders" as I18nKey });
  return (
    <p>
      {useBreadcrumbs()
        .map((crumb) => crumb.label)
        .join(" > ")}
    </p>
  );
}

afterEach(cleanup);

describe("PanelShell", () => {
  it("shares its panel", () => {
    render(
      <PanelShell panel={PANEL}>
        <Probe />
      </PanelShell>,
    );
    expect(screen.getByText("admin")).toBeTruthy();
  });

  it("holds the breadcrumb trail of the pages under it", () => {
    render(
      <PanelShell panel={PANEL}>
        <CrumbProbe />
      </PanelShell>,
    );
    expect(screen.getByText("orders")).toBeTruthy();
  });

  it("makes usePanel refuse outside a shell", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(/PanelShell/);
  });
});

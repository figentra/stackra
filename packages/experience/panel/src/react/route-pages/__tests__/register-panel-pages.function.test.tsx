/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPanelPages`: after it, navigation's panel route renders the panel's shell for the
 *          class, and its disposer takes the registration back.
 * Boundary: unit tier, jsdom; navigation's `toPanel` in a memory router is real, the shell is a recording stand-in.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import { toPanel } from "@stackra/navigation/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

import { Panel } from "#core/bases/panel.base";
import { registerPanelPages } from "#react/route-pages/register-panel-pages.function";

const framed = vi.hoisted(() => [] as unknown[]);

vi.mock("#react/panel-shell/panel-shell", async () => {
  const { createElement } = await import("react");
  return {
    PanelShell: (props: { readonly panel: unknown }) => {
      framed.push(props.panel);
      return createElement("p", null, "shell");
    },
  };
});

class AdminPanel extends Panel({ path: "/admin", area: ApiArea.Admin }) {}

/** Mounts the panel route at its path. */
const mount = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([toPanel(AdminPanel)], { initialEntries: ["/admin"] })}
    />,
  );

afterEach(() => {
  cleanup();
  framed.length = 0;
});

describe("registerPanelPages", () => {
  it("makes navigation's panel route render the panel's shell", async () => {
    const dispose = registerPanelPages();
    mount();
    expect(await screen.findByText("shell")).toBeTruthy();
    expect(framed[0]).toEqual({ key: "admin", path: "/admin", area: ApiArea.Admin });
    dispose();
  });

  it("takes the registration back with its disposer", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    registerPanelPages()();
    mount();
    expect(await screen.findByText(/No panel page is registered/)).toBeTruthy();
    expect(framed).toEqual([]);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `PanelRoutePage`: it frames the panel the class declares (its key from the class name, its
 *          recorded path and area) in the shell, and refuses a class that is not a panel.
 * Boundary: unit tier, jsdom, in a memory router; the shell is a recording stand-in. What it frames is
 *           `register-panel-pages.function.test.tsx`'s.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { ApiArea } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import { Panel } from "#core/bases/panel.base";
import { PanelRoutePage } from "#react/route-pages/panel-route-page";

const framed = vi.hoisted(() => [] as unknown[]);

vi.mock("#react/panel-shell/panel-shell", () => ({
  PanelShell: (props: { readonly panel: unknown }) => {
    framed.push(props.panel);
    return null;
  },
}));

class CustomerPortalPanel extends Panel({
  path: "/portal",
  area: ApiArea.App,
}) {}

afterEach(() => {
  cleanup();
  framed.length = 0;
});

describe("PanelRoutePage", () => {
  it("frames the panel the class declares", () => {
    render(
      <MemoryRouter initialEntries={["/portal"]}>
        <PanelRoutePage panel={CustomerPortalPanel} />
      </MemoryRouter>,
    );
    expect(framed).toEqual([{ key: "customer_portal", path: "/portal", area: ApiArea.App }]);
  });

  it("refuses a class that is not a panel", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    class NotAPanel {
      readonly isPanel = false;
    }
    expect(() =>
      render(
        <MemoryRouter>
          <PanelRoutePage panel={NotAPanel} />
        </MemoryRouter>,
      ),
    ).toThrow(TypeError);
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the Surfaces is a group named by its label drawing each surface's real button in its frame (a
 *          titled window for web and desktop, a phone for phone), in reading order from the keyboard, with an Arabic
 *          surface in its own language and direction inside an English page, inside one ruled band.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is a stand-in, and the locale comes from
 *           `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { Surfaces } from "#react/surfaces/surfaces";
import type { SurfacesProps } from "#react/surfaces/surfaces.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const SURFACES: SurfacesProps["surfaces"] = [
  { id: "web", kind: "web", title: "orders.example", button: "Cancel order" },
  { id: "desktop", kind: "desktop", title: "Orders", button: "Cancel order" },
  { id: "phone-ar", kind: "phone", title: "Phone", button: "إلغاء الطلب", lang: "ar" },
];

describe("Surfaces", () => {
  afterEach(cleanup);

  it("is a named group of framed surfaces, each with its button, in one ruled band", () => {
    const { container } = render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    const group = screen.getByRole("group", { name: "On every surface" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Cancel order",
      "Cancel order",
      "إلغاء الطلب",
    ]);
    const frames = [...container.querySelectorAll('[data-slot="frame"]')];
    expect(frames.map((frame) => frame.getAttribute("data-variant"))).toEqual([
      "window",
      "window",
      "phone",
    ]);
    expect(frames[0]?.textContent).toContain("orders.example");
    expect(container.querySelectorAll('[data-slot="blueprint-section"]')).toHaveLength(1);
  });

  it("reaches the buttons in reading order from the keyboard", () => {
    render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    const buttons = screen.getAllByRole("button");
    for (const [index, button] of buttons.entries()) {
      button.focus();
      expect(document.activeElement).toBe(button);
      const next = buttons[index + 1];
      if (next)
        expect(
          button.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    }
  });

  it("draws an Arabic surface right to left inside an English page", () => {
    render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    const arabic = screen.getByRole("button", { name: "إلغاء الطلب" }).closest("[lang]");
    expect(arabic?.getAttribute("lang")).toBe("ar");
    expect(arabic?.getAttribute("dir")).toBe("rtl");
    expect(screen.getAllByRole("button", { name: "Cancel order" })[0]?.closest("[dir]")).toBeNull();
  });

  it("reads the same in an Arabic page", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <Surfaces label="على كل واجهة" surfaces={SURFACES} />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("group", { name: "على كل واجهة" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});

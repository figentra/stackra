/**
 * Stackra file contract:
 * Purpose: proves the Surfaces is a group named by its label drawing each surface's real button in its frame (a
 *          titled window for web and desktop, a phone for phone) as an illustration: one image per surface named by
 *          its own words in its own language, and no focusable button; an Arabic surface keeps its language and
 *          direction inside an English page, inside one ruled band.
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

  it("is a named group of framed surfaces, each an image named by its words, in one ruled band", () => {
    const { container } = render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    const group = screen.getByRole("group", { name: "On every surface" });
    expect(
      within(group)
        .getAllByRole("img")
        .map((image) => image.getAttribute("aria-label")),
    ).toEqual(["orders.example, Cancel order", "Orders, Cancel order", "Phone, إلغاء الطلب"]);
    // The drawn buttons are the real ones, in their frames.
    expect([...container.querySelectorAll("button")].map((button) => button.textContent)).toEqual([
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

  it("is an illustration: no focusable or announced button", () => {
    const { container } = render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    // jsdom does not apply `inert`, so check that every drawn button sits inside an inert screen.
    for (const button of container.querySelectorAll("button"))
      expect(button.closest("[inert]")).not.toBeNull();
  });

  it("draws an Arabic surface right to left inside an English page", () => {
    const { container } = render(<Surfaces label="On every surface" surfaces={SURFACES} />);
    const arabic = screen.getByRole("img", { name: "Phone, إلغاء الطلب" });
    expect(arabic.getAttribute("lang")).toBe("ar");
    const [english, , arabicButton] = container.querySelectorAll("button");
    expect(arabicButton?.closest("[lang]")?.getAttribute("dir")).toBe("rtl");
    expect(english?.closest("[dir]")).toBeNull();
    expect(english?.closest("[lang]")).toBeNull();
  });

  it("reads the same in an Arabic page", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <Surfaces label="على كل واجهة" surfaces={SURFACES} />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("group", { name: "على كل واجهة" })).toBeTruthy();
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});

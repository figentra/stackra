/**
 * Stackra file contract:
 * Purpose: proves the web Screen is the page's `main` landmark that names itself only when given a `label`, fills the
 *          window and scrolls by default, holds its content without scrolling when `isScrollable` is false, keeps clear
 *          of the title bar, home indicator and side notch for exactly the `edges` it is given (all three by default,
 *          none for `[]`), accepts `isKeyboardAvoiding` without drawing it, becomes a plain unnamed `div` when
 *          `isEmbedded`, lets the caller's classes win over the defaults, passes unknown props through, and refuses
 *          `aria-label` at the type level. The three edge names are the contract's enum.
 * Boundary: jsdom with real React; the theme CSS is not loaded, so classes and attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0314 (decisions 5 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-174
import { render, screen } from "@testing-library/react";

import { ScreenEdge } from "#contracts/enums/screen-edge.enum";
import { Screen, type ScreenProps } from "#react/screen/screen";

const TOP = "pt-[env(titlebar-area-height,env(safe-area-inset-top,0px))]";
const BOTTOM = "pb-[env(safe-area-inset-bottom,0px)]";
const SIDES = "pl-[env(safe-area-inset-left,0px)]";

const rootMain = () => screen.getByRole("main");

describe("Screen (web)", () => {
  it("names the three edges of the contract", () => {
    expect([...ScreenEdge]).toEqual(["top", "bottom", "sides"]);
  });

  it("is the main landmark, unnamed unless given a label", () => {
    const { rerender } = render(<Screen>Orders</Screen>);
    const main = screen.getByRole("main");
    expect(main.tagName).toBe("MAIN");
    expect(main.hasAttribute("aria-label")).toBe(false);
    rerender(<Screen label="Orders screen">Orders</Screen>);
    expect(screen.getByRole("main", { name: "Orders screen" })).toBeTruthy();
  });

  it("fills the window and scrolls by default, and only holds its content when not scrollable", () => {
    const { rerender } = render(<Screen>Orders</Screen>);
    expect(rootMain().className).toContain("h-dvh");
    expect(rootMain().className).toContain("overflow-y-auto");
    rerender(<Screen isScrollable={false}>Orders</Screen>);
    expect(rootMain().className).toContain("overflow-hidden");
    expect(rootMain().className).not.toContain("overflow-y-auto");
  });

  it("keeps clear of every edge by default", () => {
    render(<Screen>Orders</Screen>);
    const { className } = screen.getByRole("main");
    for (const inset of [TOP, BOTTOM, SIDES]) expect(className).toContain(inset);
    expect(className).toContain("pr-[env(safe-area-inset-right,0px)]");
  });

  it.each([
    { edges: ["top"] as const, has: [TOP], lacks: [BOTTOM, SIDES] },
    { edges: ["bottom"] as const, has: [BOTTOM], lacks: [TOP, SIDES] },
    { edges: ["sides"] as const, has: [SIDES], lacks: [TOP, BOTTOM] },
    { edges: [] as const, has: [], lacks: [TOP, BOTTOM, SIDES] },
  ])("keeps clear of $edges only", ({ edges, has, lacks }) => {
    render(<Screen edges={edges}>Orders</Screen>);
    const { className } = screen.getByRole("main");
    for (const inset of has) expect(className).toContain(inset);
    for (const inset of lacks) expect(className).not.toContain(inset);
  });

  it("accepts isKeyboardAvoiding without drawing it", () => {
    render(<Screen isKeyboardAvoiding={false}>Orders</Screen>);
    const main = screen.getByRole("main");
    expect(main.getAttributeNames().join(" ")).not.toContain("keyboard");
  });

  it("is a plain unnamed div when embedded, so the page keeps one main", () => {
    render(
      <Screen isEmbedded label="Sample" data-testid="sample">
        Orders
      </Screen>,
    );
    const sample = screen.getByTestId("sample");
    expect(sample.tagName).toBe("DIV");
    expect(sample.hasAttribute("aria-label")).toBe(false);
    expect(screen.queryByRole("main")).toBeNull();
  });

  it("lets the caller's classes win and passes unknown props through", () => {
    render(
      <Screen className="h-64" id="orders-screen" data-testid="screen">
        Orders
      </Screen>,
    );
    const main = screen.getByTestId("screen");
    expect(main.className).toContain("h-64");
    expect(main.className).not.toContain("h-dvh");
    expect(main.id).toBe("orders-screen");
  });

  it("refuses the raw `aria-label` at the type level", () => {
    // @ts-expect-error: `label` is the landmark's name, not `aria-label`
    const refused: ScreenProps = { "aria-label": "Orders" };
    expect(refused).toBeTruthy();
  });
});

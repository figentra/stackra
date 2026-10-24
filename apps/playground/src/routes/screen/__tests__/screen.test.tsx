/**
 * Stackra file contract:
 * Purpose: proves the screen page titles the document, sits at /screen under Layout, draws five edge samples with the
 *          insets of exactly the edges each is given, a scrolling sample and one that only holds its content, an Arabic
 *          screen in a right-to-left block with Arabic text, draws every sample as a plain div so the page holds no
 *          `main` of its own, and runs the live screen: the scrolling switch and the edge checkboxes change the screen's
 *          classes and the page reports what they are set to and how often the button was pressed.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded, so classes are
 *           checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0317; ADR 0022 (test placement).
 */
// @covers sta-350:FR-177
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Screen } from "#src/routes/screen/screen";
import { ScreenRoute } from "#src/routes/screen/screen.route";

const TOP = "pt-[env(titlebar-area-height,env(safe-area-inset-top,0px))]";
const BOTTOM = "pb-[env(safe-area-inset-bottom,0px)]";
const SIDES = "pl-[env(safe-area-inset-left,0px)]";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Screen />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const sample = (name: string) => document.querySelector(`[data-sample="${name}"]`) as HTMLElement;
const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("Screen page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /screen under Layout", () => {
    renderPage();
    expect(ScreenRoute.path).toBe("/screen");
    expect(ScreenRoute.category).toBe("Layout");
    expect(screen.getByRole("heading", { level: 1, name: "Screen" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Screen · Stackra Playground");
  });

  it("draws every sample as a plain div, so the page holds no main of its own", () => {
    renderPage();
    expect(screen.queryByRole("main")).toBeNull();
    expect(sample("all").tagName).toBe("DIV");
  });

  it.each([
    { name: "all", has: [TOP, BOTTOM, SIDES], lacks: [] },
    { name: "top", has: [TOP], lacks: [BOTTOM, SIDES] },
    { name: "bottom", has: [BOTTOM], lacks: [TOP, SIDES] },
    { name: "sides", has: [SIDES], lacks: [TOP, BOTTOM] },
    { name: "none", has: [], lacks: [TOP, BOTTOM, SIDES] },
  ])("keeps the $name sample clear of its edges only", ({ name, has, lacks }) => {
    renderPage();
    for (const inset of has) expect(sample(name).className).toContain(inset);
    for (const inset of lacks) expect(sample(name).className).not.toContain(inset);
  });

  it("draws one scrolling sample and one that only holds its content", () => {
    renderPage();
    expect(sample("scrolls").className).toContain("overflow-y-auto");
    expect(sample("holds").className).toContain("overflow-hidden");
    expect(within(sample("scrolls")).getByRole("button", { name: "Press me" })).toBeTruthy();
  });

  it("draws the Arabic screen in a right-to-left block with Arabic text", () => {
    renderPage();
    const block = sample("arabic");
    expect(block.getAttribute("dir")).toBe("rtl");
    expect(block.getAttribute("lang")).toBe("ar");
    expect(within(block).getByText("محتوى الشاشة")).toBeTruthy();
    expect(within(block).getByRole("button", { name: "اضغط هنا" })).toBeTruthy();
  });

  it("runs the live screen: the switch, the edges and the button are each reported", () => {
    renderPage();
    const live = section("Try it");
    const status = () => live.getAllByRole("status").map((node) => node.textContent);
    expect(status()).toEqual([
      "Scrolling is on. Kept clear: top, bottom, sides.",
      "Not pressed yet.",
    ]);
    expect(sample("live").className).toContain("overflow-y-auto");
    expect(sample("live").className).toContain(TOP);

    press(live.getByRole("switch", { name: "Scrolls" }));
    expect(status()[0]).toBe("Scrolling is off. Kept clear: top, bottom, sides.");
    expect(sample("live").className).toContain("overflow-hidden");

    press(live.getByRole("checkbox", { name: "Top" }));
    expect(status()[0]).toBe("Scrolling is off. Kept clear: bottom, sides.");
    expect(sample("live").className).not.toContain(TOP);
    expect(sample("live").className).toContain(BOTTOM);

    press(within(sample("live")).getByRole("button", { name: "Press me" }));
    press(within(sample("live")).getByRole("button", { name: "Press me" }));
    expect(status()[1]).toBe("Pressed 2 times.");
  });
});

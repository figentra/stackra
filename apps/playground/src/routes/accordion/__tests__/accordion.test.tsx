/**
 * Stackra file contract:
 * Purpose: proves the accordion page titles the document, shows the single and several-open accordions, both variants,
 *          the sections open at the start, a disabled section and a disabled accordion, the link in a section, and a live
 *          accordion whose open ids the page holds, reports and changes from outside.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-140
import { AccordionVariant } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Accordion } from "#src/routes/accordion/accordion";
import { AccordionRoute } from "#src/routes/accordion/accordion.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Accordion />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());
const openIn = (scope: ReturnType<typeof section>) =>
  scope
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-expanded") === "true")
    .map((button) => button.textContent);

describe("Accordion page", () => {
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

  it("titles the page and the document, and sits at /accordion under Data display", () => {
    renderPage();
    expect(routePath(AccordionRoute)).toBe("/accordion");
    expect(AccordionRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: "Accordion" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Accordion · Stackra Playground");
  });

  it("opens one section at a time in the single accordion and several in the other", () => {
    renderPage();
    const single = section("One open at a time");
    press(single.getByRole("button", { name: "How long does shipping take?" }));
    press(single.getByRole("button", { name: "Can I return an order?" }));
    expect(openIn(single)).toEqual(["Can I return an order?"]);
    const multiple = section("Several open");
    press(multiple.getByRole("button", { name: "How long does shipping take?" }));
    press(multiple.getByRole("button", { name: "Can I return an order?" }));
    expect(openIn(multiple)).toEqual(["How long does shipping take?", "Can I return an order?"]);
  });

  it("shows every variant", () => {
    renderPage();
    const variants = section("Variants");
    const roots = [...document.querySelectorAll('[data-slot="accordion"]')];
    for (const variant of AccordionVariant) {
      expect(variants.getByText(`${variant} accordion`)).toBeTruthy();
    }
    expect(roots.some((root) => root.classList.contains("accordion--surface"))).toBe(true);
  });

  it("opens the sections it is told to at the start", () => {
    renderPage();
    expect(openIn(section("Open at the start"))).toEqual([
      "How long does shipping take?",
      "Is there a warranty?",
    ]);
  });

  it("shows a refused section and a disabled accordion", () => {
    renderPage();
    const states = section("States");
    const buttons = states.getAllByRole("button");
    expect(buttons.filter((button) => button.hasAttribute("disabled"))).toHaveLength(4);
    // The refused section and the same section of the disabled accordion, both refused.
    const returns = states.getAllByRole("button", { name: "Can I return an order?" });
    expect(returns).toHaveLength(2);
    expect(returns.every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("draws the link in a section when it is opened", () => {
    renderPage();
    const rich = section("Rich content");
    press(rich.getByRole("button", { name: "Can I return an order?" }));
    expect(rich.getByRole("link", { name: /Read the returns policy/ })).toBeTruthy();
  });

  it("holds the live open ids, reports them in order and changes them from outside", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByText("Open: shipping")).toBeTruthy();
    press(live.getByRole("button", { name: "Is there a warranty?" }));
    expect(live.getByText("Open: shipping, warranty")).toBeTruthy();
    press(live.getByRole("button", { name: "Expand all" }));
    expect(live.getByText("Open: shipping, returns, warranty")).toBeTruthy();
    press(live.getByRole("button", { name: "Collapse all" }));
    expect(live.getByText("Open: none")).toBeTruthy();
    expect(openIn(live)).toEqual([]);
  });
});

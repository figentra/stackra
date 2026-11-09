/**
 * Stackra file contract:
 * Purpose: proves the web Illustration stacks the four tone layers in painter's order, each masked by its own
 *          `<src>.<tone>.svg` and filled with its token role, is an image named by `alt` or hidden decoration without
 *          it, never draws narrower than half its viewBox width, adds no focus stop, and draws the same in
 *          right-to-left and under reduced motion.
 * Boundary: jsdom; classes, attributes and inline custom properties are checked, not computed styles or masks;
 *           `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); ADR 0060; STA-2041.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Illustration } from "#react/illustration/illustration";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

describe("Illustration (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
  });

  it("stacks the four tone layers, each masked by its file and filled with its role", () => {
    const { container } = render(<Illustration src="art/engine" width={640} height={480} />);
    const layers = [...container.querySelectorAll<HTMLElement>('[data-slot="illustration-layer"]')];
    expect(layers.map((layer) => layer.dataset.tone)).toEqual(["ground", "dots", "line", "core"]);
    const roles = ["--background", "--stk-tile-line", "--accent", "--core"];
    for (const [index, layer] of layers.entries()) {
      const tone = layer.dataset.tone ?? "";
      expect(layer.style.getPropertyValue("--illustration-mask")).toBe(
        `url("art/engine.${tone}.svg")`,
      );
      expect(layer.className).toContain(`[background-color:var(${roles[index] ?? ""})]`);
      expect(layer.className).toContain("[mask-image:var(--illustration-mask)]");
      expect(layer.className).toContain("[mask-mode:luminance]");
      expect(layer.className).toContain("[mask-size:100%_100%]");
    }
  });

  it("is an image named by its alt", () => {
    render(
      <Illustration src="art/stack" width={400} height={300} alt="The stack, floor by floor" />,
    );
    const image = screen.getByRole("img", { name: "The stack, floor by floor" });
    expect(image.getAttribute("aria-hidden")).toBeNull();
  });

  it("is hidden decoration without an alt, with no focus stop", () => {
    const { container } = render(<Illustration src="art/monitor" width={400} height={300} />);
    const root = container.querySelector<HTMLElement>('[data-slot="illustration"]');
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.getAttribute("role")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("never draws narrower than half its viewBox width, rounded up", () => {
    const { container } = render(<Illustration src="art/engine" width={641} height={480} />);
    const root = container.querySelector<HTMLElement>('[data-slot="illustration"]');
    expect(root?.style.minWidth).toBe("321px");
  });

  it("draws the same in right-to-left and under reduced motion, never mirrored", () => {
    const drawing = <Illustration src="art/engine" width={640} height={480} alt="The engine" />;
    const { container, rerender } = render(drawing);
    const ltr = container.innerHTML;
    rerender(<I18nProvider locale="ar">{drawing}</I18nProvider>);
    expect(container.innerHTML).toBe(ltr);
    expect(container.querySelector("[class*='scale-x'], [class*='rtl:']")).toBeNull();
    state.isReduced = true;
    rerender(drawing);
    expect(container.innerHTML).toBe(ltr);
  });
});

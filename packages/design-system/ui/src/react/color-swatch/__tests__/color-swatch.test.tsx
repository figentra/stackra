/**
 * Stackra file contract:
 * Purpose: proves the web ColorSwatch: an image named by its label, or by React Aria's description of the colour when
 *          it has none; the size and shape reach HeroUI's classes; a colour React Aria cannot parse is still drawn,
 *          named by its label or hidden; unknown props pass through; and right-to-left changes nothing.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles, attributes and classes are
 *           checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1981.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { ColorSwatch } from "#react/color-swatch/color-swatch";
import { isParsableColor } from "#react/color-swatch/is-parsable-color.function";

describe("ColorSwatch (web)", () => {
  it("is an image named by its label, in the size and shape asked for", () => {
    render(<ColorSwatch color="#0485f7" label="Ocean blue" size="lg" shape="square" />);
    const swatch = screen.getByRole("img", { name: /Ocean blue/ });
    expect(swatch.className).toContain("color-swatch--lg");
    expect(swatch.className).toContain("color-swatch--square");
  });

  it("is described by React Aria without a label and passes unknown props through", () => {
    render(<ColorSwatch color="#ff0000" data-testid="swatch" />);
    const swatch = screen.getByTestId("swatch");
    expect(swatch.getAttribute("role")).toBe("img");
    expect(swatch.getAttribute("aria-label")).toBeTruthy();
    expect(swatch.className).toContain("color-swatch--md");
  });

  it("draws a colour React Aria cannot parse, named by its label or hidden", () => {
    const { container, rerender } = render(<ColorSwatch color="var(--accent)" label="Accent" />);
    const swatch = screen.getByRole("img", { name: "Accent" });
    expect(swatch.style.backgroundColor).toBe("var(--accent)");
    rerender(<ColorSwatch color="var(--accent)" size="sm" />);
    const hidden = container.querySelector("span") as HTMLElement;
    expect(hidden.getAttribute("aria-hidden")).toBe("true");
    expect(hidden.className).toContain("color-swatch--sm");
  });

  it("tells a parsable colour from one that is not", () => {
    expect(isParsableColor("#abc")).toBe(true);
    expect(isParsableColor("rgb(4, 133, 247)")).toBe(true);
    expect(isParsableColor("oklch(0.6 0.2 250)")).toBe(false);
  });

  it("is the same in right-to-left", () => {
    render(
      <div dir="rtl">
        <ColorSwatch color="#10b981" label="أخضر" />
      </div>,
    );
    expect(screen.getByRole("img", { name: /أخضر/ })).toBeTruthy();
  });
});

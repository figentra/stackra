/**
 * Stackra file contract:
 * Purpose: proves the web Flag: a country code draws its emoji, a language tag its region's, a labelled flag is an
 *          image named by its label, an unlabelled one is hidden, a code with no flag shows the code, the size sets the
 *          text size, and right-to-left changes nothing.
 * Boundary: jsdom; the theme CSS is not loaded, so roles, text and classes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1981.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Flag } from "#react/flag/flag";

describe("Flag (web)", () => {
  it("is an image named by its label, drawn as the country's emoji", () => {
    render(<Flag code="sa" label="Saudi Arabia" />);
    const flag = screen.getByRole("img", { name: "Saudi Arabia" });
    expect(flag.textContent).toBe("🇸🇦");
    expect(flag.className).toContain("text-xl");
  });

  it("draws a language tag's region and is hidden without a label", () => {
    const { container } = render(<Flag code="ar-SA" size="lg" />);
    const flag = container.querySelector("span") as HTMLElement;
    expect(flag.getAttribute("aria-hidden")).toBe("true");
    expect(flag.textContent).toBe("🇸🇦");
    expect(flag.className).toContain("text-3xl");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows the code when there is no flag for it", () => {
    render(<Flag code="sr-Latn" label="Serbian" />);
    expect(screen.getByRole("img", { name: "Serbian" }).textContent).toBe("sr-Latn");
  });

  it("is the same in right-to-left", () => {
    render(
      <div dir="rtl">
        <Flag code="ae" label="الإمارات" size="sm" />
      </div>,
    );
    const flag = screen.getByRole("img", { name: "الإمارات" });
    expect(flag.textContent).toBe("🇦🇪");
    expect(flag.className).toContain("text-base");
  });
});

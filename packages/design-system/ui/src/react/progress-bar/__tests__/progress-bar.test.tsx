/**
 * Stackra file contract:
 * Purpose: proves the web ProgressBar draws HeroUI's bar at the three sizes and in every tone, is a named progressbar
 *          with a value (clamped to its range, in the percentage or the caller's text) or without one (indeterminate,
 *          no value attributes), names itself by `aria-label` or by its visible label, shows the value text only when
 *          asked and only while it has a value, and passes every other prop and the ref through.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes, attributes and inline styles are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-118
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import type { ProgressBarProps } from "#react/progress-bar/progress-bar.props";

const fillOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".progress-bar__fill");

describe("ProgressBar (web)", () => {
  it("is a medium accent bar with only a label, and indeterminate", () => {
    render(<ProgressBar label="Uploading" />);
    const bar = screen.getByRole("progressbar", { name: "Uploading" });
    expect(bar.classList.contains("progress-bar--md")).toBe(true);
    expect(bar.classList.contains("progress-bar--accent")).toBe(true);
    for (const name of ["aria-valuenow", "aria-valuetext"])
      expect(bar.hasAttribute(name), name).toBe(false);
  });

  it.each(Size)("draws size %s", (size) => {
    render(<ProgressBar label="Uploading" size={size} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-bar--${size}`)).toBe(true);
  });

  it.each(Tone)("draws tone %s", (tone) => {
    render(<ProgressBar label="Uploading" tone={tone} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-bar--${tone}`)).toBe(true);
  });

  it("is determinate with a value: its number, its percentage text and a fill of that width", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("40%");
    expect(fillOf(container)?.style.width).toBe("40%");
  });

  it("is determinate at zero, not indeterminate", () => {
    const { container } = render(<ProgressBar label="Uploading" value={0} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
    expect(fillOf(container)?.style.width).toBe("0%");
  });

  it.each([
    [-5, "0", "0%"],
    [250, "100", "100%"],
  ])("holds %s to the range", (value, now, width) => {
    const { container } = render(<ProgressBar label="Uploading" value={value} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(now);
    expect(fillOf(container)?.style.width).toBe(width);
  });

  it("measures a custom range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressBar
        label="Uploading"
        value={3}
        minValue={0}
        maxValue={12}
        valueLabel="3 of 12 files"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemax")).toBe("12");
    expect(bar.getAttribute("aria-valuetext")).toBe("3 of 12 files");
    expect(fillOf(container)?.style.width).toBe("25%");
  });

  it("names itself by aria-label and draws no text when the label is hidden", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Uploading");
    expect(container.textContent).toBe("");
  });

  it("draws the label and names the bar by it when it is visible", () => {
    const { container } = render(<ProgressBar label="Storage used" value={40} isLabelVisible />);
    const bar = screen.getByRole("progressbar", { name: "Storage used" });
    expect(bar.hasAttribute("aria-label")).toBe(false);
    expect(container.querySelector('[data-slot="label"]')?.textContent).toBe("Storage used");
  });

  it("draws the value text only when asked, and not while indeterminate", () => {
    const { container, rerender } = render(
      <ProgressBar label="Uploading" value={40} isValueVisible />,
    );
    expect(container.querySelector(".progress-bar__output")?.textContent).toBe("40%");
    rerender(<ProgressBar label="Uploading" value={3} valueLabel="3 of 12" isValueVisible />);
    expect(container.querySelector(".progress-bar__output")?.textContent).toBe("3 of 12");
    rerender(<ProgressBar label="Uploading" isValueVisible />);
    expect(container.querySelector(".progress-bar__output")).toBeNull();
    rerender(<ProgressBar label="Uploading" value={40} />);
    expect(container.querySelector(".progress-bar__output")).toBeNull();
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressBar
        ref={ref}
        label="Uploading"
        id="b"
        data-testid="bar"
        aria-describedby="d"
        className="max-w-xs"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.id).toBe("b");
    expect(bar.getAttribute("data-testid")).toBe("bar");
    expect(bar.getAttribute("aria-describedby")).toBe("d");
    expect(bar.classList.contains("max-w-xs")).toBe(true);
    expect(ref.current).toBe(bar);
  });

  it("types: extends the contract, needs a label and refuses `color`, `isIndeterminate` and the name props", () => {
    expectTypeOf<ProgressBarProps>().toExtend<ProgressBarContractProps>();
    // @ts-expect-error a progress bar must be named
    render(<ProgressBar />);
    // @ts-expect-error the colour role is `tone`
    render(<ProgressBar label="x" color="danger" />);
    // @ts-expect-error a missing `value` is what makes it indeterminate
    render(<ProgressBar label="x" isIndeterminate />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<ProgressBarProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressBar label="x">child</ProgressBar>);
  });
});

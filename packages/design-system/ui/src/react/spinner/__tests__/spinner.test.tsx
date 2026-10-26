/**
 * Stackra file contract:
 * Purpose: proves the web Spinner draws HeroUI's spinner at the three sizes and in every tone's role, is one named
 *          status with a label and hidden without one, never carries HeroUI's English "Loading", and passes every
 *          other prop and the ref through.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes and inline styles are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-042 sta-350:P-032 sta-350:P-034
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";
import { Spinner } from "#react/spinner/spinner";
import type { SpinnerProps } from "#react/spinner/spinner.props";

const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".spinner");

describe("Spinner (web)", () => {
  it("is a medium accent spinner with no props", () => {
    const { container } = render(<Spinner />);
    expect(rootOf(container)?.classList.contains("spinner--md")).toBe(true);
    expect(rootOf(container)?.classList.contains("spinner--accent")).toBe(true);
  });

  it.each(Size)("draws size %s", (size) => {
    const { container } = render(<Spinner size={size} />);
    expect(rootOf(container)?.classList.contains(`spinner--${size}`)).toBe(true);
  });

  it.each(TextTone)("draws tone %s in its role", (tone) => {
    const { container } = render(<Spinner tone={tone} />);
    const root = rootOf(container);
    if (tone === "default" || tone === "muted") {
      expect(root?.classList.contains("spinner--current")).toBe(true);
      expect(root?.style.color).toBe(`var(--${tone === "default" ? "foreground" : "muted"})`);
    } else {
      expect(root?.classList.contains(`spinner--${tone}`)).toBe(true);
      expect(root?.style.color).toBe("");
    }
  });

  it("lets the caller's colour win over the role's", () => {
    const { container } = render(<Spinner tone="muted" style={{ color: "red" }} />);
    expect(rootOf(container)?.style.color).toBe("red");
  });

  it("is one status named by its label, never HeroUI's English one", () => {
    render(<Spinner label="جارٍ التحميل" />);
    const status = screen.getByRole("status", { name: "جارٍ التحميل" });
    expect(status.hasAttribute("aria-hidden")).toBe(false);
    expect(screen.queryByRole("status", { name: "Loading" })).toBeNull();
    expect(status.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is hidden without a label, or with an empty one", () => {
    const { container, rerender } = render(<Spinner />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<Spinner label="" />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Spinner
        ref={ref}
        id="s"
        title="Wait"
        data-testid="spinner"
        aria-describedby="d"
        className="animate-[spin_1.5s_linear_infinite]"
      />,
    );
    const root = rootOf(container);
    expect(root?.id).toBe("s");
    expect(root?.getAttribute("title")).toBe("Wait");
    expect(root?.getAttribute("data-testid")).toBe("spinner");
    expect(root?.getAttribute("aria-describedby")).toBe("d");
    expect(root?.classList.contains("animate-[spin_1.5s_linear_infinite]")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses `color`, `aria-label` and `xl`", () => {
    expectTypeOf<SpinnerProps>().toExtend<SpinnerContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Spinner color="danger" />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error a wait that big is a skeleton
    render(<Spinner size="xl" />);
  });
});

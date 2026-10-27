/**
 * Stackra file contract:
 * Purpose: proves the web Alert announces by its tone (an alert and assertive for warning and danger, a status and
 *          polite for the rest, never a role from the caller), draws the tone's icon unless another or none is given,
 *          lays out the title, description and actions in order, passes unknown props through, and that the type
 *          requires a title and refuses HeroUI's `status` and a caller's `role`.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes and attributes are read, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-112 sta-350:FR-113
import { Enum, Tone } from "@stackra/contracts";
import { render, screen } from "@testing-library/react";

import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { Alert } from "#react/alert/alert";
import type { AlertProps } from "#react/alert/alert.props";

/** The alert's root element. */
const rootOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="alert-root"]');

describe("Alert (web)", () => {
  it.each(Enum.values(Tone))("announces a %s alert by its tone", (tone) => {
    const { container } = render(<Alert tone={tone} title="Heads up" />);
    const root = rootOf(container);
    const { role } = FEEDBACK_BY_TONE[tone];
    expect(root?.getAttribute("role")).toBe(role);
    expect(root?.getAttribute("aria-live")).toBe(role === "alert" ? "assertive" : "polite");
    expect(root?.classList.contains(`alert--${tone}`)).toBe(true);
  });

  it("is a default alert without a tone", () => {
    const { container } = render(<Alert title="Heads up" />);
    expect(rootOf(container)?.classList.contains("alert--default")).toBe(true);
    expect(rootOf(container)?.getAttribute("role")).toBe("status");
  });

  it("draws the tone's own icon, decorative", () => {
    const { container } = render(<Alert tone="danger" title="Payment failed" />);
    const indicator = container.querySelector('[data-slot="alert-indicator"]');
    const icon = indicator?.querySelector("svg");
    expect(icon?.classList.contains("lucide-circle-alert")).toBe(true);
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect([icon?.getAttribute("width"), icon?.getAttribute("height")]).toEqual(["16", "16"]);
  });

  it("draws another icon by name, an element as given, and none for false", () => {
    const { container, rerender } = render(<Alert tone="danger" title="Heads up" icon="info" />);
    expect(container.querySelector("svg.lucide-info")).toBeTruthy();
    expect(container.querySelector("svg.lucide-circle-alert")).toBeNull();
    rerender(<Alert title="Heads up" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
    rerender(<Alert title="Heads up" icon={false} />);
    expect(container.querySelector('[data-slot="alert-indicator"]')).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("puts the title, the description and the actions in that order", () => {
    const { container } = render(
      <Alert
        tone="warning"
        title="Storage is almost full"
        description="Delete files or upgrade."
        actions={<button type="button">Upgrade</button>}
      />,
    );
    const content = container.querySelector('[data-slot="alert-content"]');
    expect([...(content?.children ?? [])].map((child) => child.getAttribute("data-slot"))).toEqual([
      "alert-title",
      "alert-description",
      "alert-actions",
    ]);
    expect(content?.querySelector('[data-slot="alert-title"]')?.textContent).toBe(
      "Storage is almost full",
    );
    expect(screen.getByRole("button", { name: "Upgrade" })).toBeTruthy();
  });

  it("leaves out the description and the actions that were not given", () => {
    const { container } = render(<Alert title="Saved" />);
    expect(container.querySelector('[data-slot="alert-description"]')).toBeNull();
    expect(container.querySelector('[data-slot="alert-actions"]')).toBeNull();
  });

  it("passes unknown props through to the root", () => {
    const { container } = render(
      <Alert title="Saved" id="a" className="extra" data-testid="alert" aria-label="Notice" />,
    );
    const root = rootOf(container);
    expect(root?.id).toBe("a");
    expect(root?.classList.contains("extra")).toBe(true);
    expect(root?.getAttribute("data-testid")).toBe("alert");
    expect(root?.getAttribute("aria-label")).toBe("Notice");
  });

  it("types: extends the contract, requires a title, refuses `status` and `role`", () => {
    expectTypeOf<AlertProps>().toExtend<AlertContractProps>();
    // @ts-expect-error the title is what a screen reader reads first
    void (<Alert />);
    // @ts-expect-error HeroUI's name for the tone is replaced by `tone`
    void (<Alert title="Saved" status="success" />);
    // @ts-expect-error the tone sets the role, never the caller
    void (<Alert title="Saved" role="alert" />);
  });
});

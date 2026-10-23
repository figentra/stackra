/**
 * Stackra file contract:
 * Purpose: proves the web Badge draws every variant, tone and size, puts each logical corner on the reading side
 *          in left-to-right and right-to-left, hides itself unless labelled and then says the label in place of its
 *          content, never takes a press, passes unknown props and the ref through, and refuses HeroUI's own names for
 *          the colour, corner and accessible name.
 * Boundary: jsdom with real HeroUI and React Aria's `I18nProvider` for the direction; the theme CSS is not loaded, so
 *          classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0060 (right-to-left); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-037 sta-350:FR-038 sta-350:P-019 sta-350:P-026 sta-350:P-027 sta-350:P-028 sta-350:P-029
import { render } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";
import { createRef, type ReactNode } from "react";

import { BadgePlacement } from "#contracts/enums/badge-placement.enum";
import { BadgeVariant } from "#contracts/enums/badge-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";
import { physicalPlacementOf } from "#core/functions/physical-placement-of.function";
import { Badge, type BadgeProps } from "#react/badge/badge";

/** Renders a badge under a locale, which is where React Aria reads the direction from. */
const inLocale = (locale: string, node: ReactNode) =>
  render(<I18nProvider locale={locale}>{node}</I18nProvider>);

const rootOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="badge"]');

describe("Badge (web)", () => {
  it("is a primary, default, medium badge with no props", () => {
    const { container } = render(<Badge>5</Badge>);
    const root = rootOf(container);
    for (const name of ["badge--primary", "badge--default", "badge--md"]) {
      expect(root?.classList.contains(name), name).toBe(true);
    }
  });

  it.each(BadgeVariant)("draws the %s variant in every tone and size", (variant) => {
    for (const tone of Tone)
      for (const size of Size) {
        const { container, unmount } = render(
          <Badge variant={variant} tone={tone} size={size}>
            5
          </Badge>,
        );
        for (const name of [`badge--${variant}`, `badge--${tone}`, `badge--${size}`]) {
          expect(rootOf(container)?.classList.contains(name), `${variant} ${tone} ${size}`).toBe(
            true,
          );
        }
        unmount();
      }
  });

  it.each(BadgePlacement)("puts %s on the reading side in both directions", (placement) => {
    for (const [locale, direction] of [
      ["en", "ltr"],
      ["ar", "rtl"],
    ] as const) {
      const { container, unmount } = inLocale(locale, <Badge placement={placement}>5</Badge>);
      const corner = physicalPlacementOf(placement, direction);
      expect(
        rootOf(container)?.classList.contains(`badge--${corner}`),
        `${placement} in ${locale}`,
      ).toBe(true);
      unmount();
    }
  });

  it("sits top-end by default: top right in English, top left in Arabic", () => {
    const english = inLocale("en", <Badge>5</Badge>);
    expect(rootOf(english.container)?.classList.contains("badge--top-right")).toBe(true);
    english.unmount();
    const arabic = inLocale("ar", <Badge>5</Badge>);
    expect(rootOf(arabic.container)?.classList.contains("badge--top-left")).toBe(true);
  });

  it("is hidden from assistive technology without a label", () => {
    const { container } = render(<Badge>5</Badge>);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector(".sr-only")).toBeNull();
  });

  it("says its label in place of its content when labelled", () => {
    const { container } = render(<Badge label="3 unread">3</Badge>);
    const root = rootOf(container);
    expect(root?.hasAttribute("aria-hidden")).toBe(false);
    expect(container.querySelector(".sr-only")?.textContent).toBe("3 unread");
    expect(container.querySelector('[data-slot="badge-label"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("speaks a labelled dot through the label alone", () => {
    const { container } = render(<Badge label="Online" />);
    expect(container.querySelector(".sr-only")?.textContent).toBe("Online");
    expect(container.querySelector('[data-slot="badge-label"]')).toBeNull();
  });

  it("puts text and numbers in the label slot, an element beside it, and nothing for a dot", () => {
    const text = render(<Badge>New</Badge>);
    expect(text.container.querySelector('[data-slot="badge-label"]')?.textContent).toBe("New");
    text.unmount();
    const number = render(<Badge>{5}</Badge>);
    expect(number.container.querySelector('[data-slot="badge-label"]')?.textContent).toBe("5");
    number.unmount();
    const element = render(
      <Badge label="Alerts">
        <i data-testid="icon" />
      </Badge>,
    );
    expect(element.container.querySelector('[data-slot="badge-label"]')).toBeNull();
    const wrapper = element.container.querySelector(".contents");
    expect(wrapper?.getAttribute("aria-hidden")).toBe("true");
    expect(wrapper?.querySelector('[data-testid="icon"]')).toBeTruthy();
    element.unmount();
    const dot = render(<Badge />);
    expect(dot.container.querySelector('[data-slot="badge-label"], .contents')).toBeNull();
  });

  it("lets presses through to the anchor and keeps the caller's class", () => {
    const { container } = render(<Badge className="ms-1">5</Badge>);
    const root = rootOf(container);
    expect(root?.classList.contains("pointer-events-none")).toBe(true);
    expect(root?.classList.contains("ms-1")).toBe(true);
  });

  it("passes the id, data props, style, description and ref through, and renders the anchor", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Badge.Anchor className="anchor" data-testid="anchor">
        <b>Avatar</b>
        <Badge ref={ref} id="b" data-testid="badge" style={{ opacity: 0.5 }} aria-describedby="d">
          5
        </Badge>
      </Badge.Anchor>,
    );
    const root = rootOf(container);
    expect(root?.id).toBe("b");
    expect(root?.getAttribute("data-testid")).toBe("badge");
    expect(root?.style.opacity).toBe("0.5");
    expect(root?.getAttribute("aria-describedby")).toBe("d");
    expect(ref.current).toBe(root);
    const anchor = container.querySelector('[data-slot="badge-anchor"]');
    expect(anchor?.classList.contains("anchor")).toBe(true);
    expect(anchor?.contains(root)).toBe(true);
  });

  it("types: extends the contract and refuses HeroUI's own names", () => {
    expectTypeOf<BadgeProps>().toExtend<BadgeContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Badge color="danger">5</Badge>);
    // JSX does not check hyphenated attributes, so these two are asserted on the type itself: the accessible name is
    // `label`, and visibility is decided by it.
    expectTypeOf<BadgeProps>().not.toHaveProperty("aria-label");
    expectTypeOf<BadgeProps>().not.toHaveProperty("aria-hidden");
    // @ts-expect-error the corner is named by reading direction, not by side
    render(<Badge placement="top-right">5</Badge>);
  });
});

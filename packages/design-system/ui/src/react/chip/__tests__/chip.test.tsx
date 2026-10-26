/**
 * Stackra file contract:
 * Purpose: proves the web Chip is a secondary, default, medium chip with no props, draws every variant, tone and size
 *          as HeroUI's classes, wraps text in the label and puts icons before and after it, sizes icons through one
 *          utility with the caller's class last, passes unknown props, the ref and `render` through, and refuses
 *          `color`, `onClick` and a missing child.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-033 sta-350:FR-034 sta-350:P-019 sta-350:P-023 sta-350:P-025 sta-350:FR-053
import { render, screen } from "@testing-library/react";
import { createElement, createRef } from "react";

import { ChipVariant } from "#contracts/enums/chip-variant.enum";
import { Size } from "#contracts/enums/size.enum";
import { Tone } from "#contracts/enums/tone.enum";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";
import { Chip } from "#react/chip/chip";
import type { ChipProps } from "#react/chip/chip.props";

describe("Chip (web)", () => {
  it("is a secondary, default, medium chip with its text in the label", () => {
    const { container } = render(<Chip>Draft</Chip>);
    const root = container.querySelector('[data-slot="chip"]');
    expect(root?.tagName).toBe("SPAN");
    for (const name of ["chip--secondary", "chip--default", "chip--md"]) {
      expect(root?.classList.contains(name)).toBe(true);
    }
    expect(root?.querySelector("span.chip__label")?.textContent).toBe("Draft");
  });

  it.each(ChipVariant)(
    "draws the %s variant in every tone and size as HeroUI's classes",
    (variant) => {
      for (const tone of Tone)
        for (const size of Size) {
          const { container, unmount } = render(
            <Chip variant={variant} tone={tone} size={size}>
              x
            </Chip>,
          );
          const root = container.querySelector('[data-slot="chip"]');
          for (const name of [`chip--${variant}`, `chip--${tone}`, `chip--${size}`]) {
            expect(root?.classList.contains(name), `${variant} ${tone} ${size}`).toBe(true);
          }
          unmount();
        }
    },
  );

  it("draws the start icon, the label and the end icon in that order", () => {
    const { container } = render(
      <Chip startIcon={<i data-testid="start" />} endIcon={<i data-testid="end" />}>
        Next
      </Chip>,
    );
    const root = container.querySelector('[data-slot="chip"]');
    expect(
      [...(root?.children ?? [])].map((node) => node.getAttribute("data-testid") ?? node.className),
    ).toEqual(["start", "chip__label", "end"]);
  });

  it("wraps a string or a number in the label and leaves an element alone", () => {
    const { container, rerender } = render(<Chip>Draft</Chip>);
    expect(container.querySelector(".chip__label")?.textContent).toBe("Draft");
    rerender(<Chip>{3}</Chip>);
    expect(container.querySelector(".chip__label")?.textContent).toBe("3");
    rerender(
      <Chip>
        <b data-testid="node">Bold</b>
      </Chip>,
    );
    expect(container.querySelector(".chip__label")).toBeNull();
    expect(screen.getByTestId("node")).toBeTruthy();
  });

  it("sizes icons to the text and keeps the caller's class after its own", () => {
    const { container } = render(<Chip className="mine">x</Chip>);
    const classes = [...(container.querySelector('[data-slot="chip"]')?.classList ?? [])];
    expect(classes).toContain("[&_svg]:size-[1em]");
    expect(classes.indexOf("mine")).toBeGreaterThan(classes.indexOf("[&_svg]:size-[1em]"));
  });

  it("passes unknown props, the ref and `render` through", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Chip ref={ref} id="c" title="Chip" data-testid="chip" aria-describedby="d" lang="ar">
        x
      </Chip>,
    );
    const root = container.querySelector('[data-slot="chip"]');
    expect(root?.id).toBe("c");
    expect(root?.getAttribute("title")).toBe("Chip");
    expect(root?.getAttribute("data-testid")).toBe("chip");
    expect(root?.getAttribute("aria-describedby")).toBe("d");
    expect(root?.getAttribute("lang")).toBe("ar");
    expect(ref.current).toBe(root);

    render(
      <Chip render={(props: object) => createElement("li", { ...props, "data-testid": "item" })}>
        y
      </Chip>,
    );
    const item = screen.getByTestId("item");
    expect(item.tagName).toBe("LI");
    expect(item.classList.contains("chip")).toBe(true);
  });

  it("types: extends the contract and refuses `color`, `onClick` and a missing child", () => {
    expectTypeOf<ChipProps>().toExtend<ChipContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Chip color="success">x</Chip>);
    // @ts-expect-error a chip is display only: a clickable span has no keyboard access
    render(<Chip onClick={() => undefined}>x</Chip>);
    // @ts-expect-error the text is the chip's name, so a chip needs children
    render(<Chip />);
  });

  it("draws an icon name through Icon and an element as given", () => {
    const { container } = render(
      <Chip startIcon="user-round" endIcon={<i data-testid="mine" />}>
        Done
      </Chip>,
    );
    expect(container.querySelector("svg.lucide-user-round")).toBeTruthy();
    expect(container.querySelector('[data-testid="mine"]')).toBeTruthy();
  });
});

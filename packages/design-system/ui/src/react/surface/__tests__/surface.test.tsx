/**
 * Stackra file contract:
 * Purpose: proves the web Surface draws every surface level as HeroUI's classes, provides the level to HeroUI
 *          components inside through `SurfaceContext`, passes unknown props, the ref and `render` through, and keeps
 *          its level names equal to HeroUI's.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-030 sta-350:P-019 sta-350:P-021
import { SurfaceContext, type SurfaceVariants } from "@heroui/react";
import { render, screen } from "@testing-library/react";
import { createElement, createRef, useContext } from "react";

import { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";
import { Surface } from "#react/surface/surface";
import type { SurfaceProps } from "#react/surface/surface.props";

/** Prints the surface level the context holds, so a test can read what HeroUI components inside would see. */
function LevelProbe() {
  return <i data-testid="level">{useContext(SurfaceContext).variant}</i>;
}

describe("Surface (web)", () => {
  it.each(SurfaceVariant)("draws the %s level as HeroUI's class", (variant) => {
    const { container } = render(<Surface variant={variant}>x</Surface>);
    const root = container.querySelector('[data-slot="surface"]');
    expect(root?.classList.contains(`surface--${variant}`)).toBe(true);
  });

  it("is a default surface when no level is given", () => {
    const { container } = render(<Surface>x</Surface>);
    expect(container.querySelector(".surface--default")).toBeTruthy();
  });

  it("gives its level to the components inside through HeroUI's context", () => {
    render(
      <Surface variant="tertiary">
        <LevelProbe />
      </Surface>,
    );
    expect(screen.getByTestId("level").textContent).toBe("tertiary");
  });

  it("passes the class, id, role, aria and data props, the ref and `render` through", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <h2 id="title">Region title</h2>
        <Surface
          ref={ref}
          id="s"
          role="region"
          aria-labelledby="title"
          data-testid="surface"
          className="mine"
          variant="secondary"
        >
          x
        </Surface>
      </>,
    );
    const region = screen.getByRole("region", { name: "Region title" });
    expect(region.id).toBe("s");
    expect(region.classList.contains("mine")).toBe(true);
    expect(region.classList.contains("surface--secondary")).toBe(true);
    expect(ref.current).toBe(region);
    expect(region instanceof HTMLDivElement).toBe(true);
  });

  it("renders another element through `render` and keeps HeroUI's classes on it", () => {
    render(
      // `render` is typed for a div, whose props carry a div ref; a plain object type lets another element take them.
      <Surface
        variant="secondary"
        render={(props: object) => createElement("section", { ...props, "data-testid": "other" })}
      >
        x
      </Surface>,
    );
    const other = screen.getByTestId("other");
    expect(other.tagName).toBe("SECTION");
    expect(other.classList.contains("surface--secondary")).toBe(true);
  });

  it("types: extends the contract and takes exactly HeroUI's levels", () => {
    expectTypeOf<SurfaceProps>().toExtend<SurfaceContractProps>();
    expectTypeOf<SurfaceVariant>().toEqualTypeOf<NonNullable<SurfaceVariants["variant"]>>();
    // @ts-expect-error `primary` is not a surface level
    render(<Surface variant="primary">x</Surface>);
  });
});

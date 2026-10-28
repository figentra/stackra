/**
 * Stackra file contract:
 * Purpose: proves the web Card draws every surface level, renders its five parts in order, places the title in the
 *          outline at `level` (default 3) with HeroUI's look kept, provides HeroUI's surface context (except when
 *          transparent), can be named as an article through the title, passes the refs through, and refuses HeroUI's
 *          own names for the parts and the element.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; WCAG 2.2 SC 1.3.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-030 sta-350:P-019 sta-350:P-020 sta-350:P-021
import { SurfaceContext } from "@heroui/react";
import { render, screen } from "@testing-library/react";
import { createRef, useContext } from "react";

import { HeadingLevel } from "#contracts/enums/heading-level.enum";
import { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { CardContractProps } from "#contracts/types/card-contract-props.type";
import type { CardTitleContractProps } from "#contracts/types/card-title-contract-props.type";
import type { CardTitleProps } from "#react/card/card-title.props";
import { Card } from "#react/card/card";
import type { CardProps } from "#react/card/card.props";

/** Prints the surface level the context holds, or `none` when no card provided one. */
function LevelProbe() {
  return <i data-testid="level">{useContext(SurfaceContext).variant ?? "none"}</i>;
}

describe("Card (web)", () => {
  it.each(SurfaceVariant)("draws the %s level as HeroUI's class", (variant) => {
    const { container } = render(<Card variant={variant}>x</Card>);
    expect(
      container.querySelector('[data-slot="card"]')?.classList.contains(`card--${variant}`),
    ).toBe(true);
  });

  it("renders the header, title, description, content and footer in order", () => {
    const { container } = render(
      <Card>
        <Card.Header>
          <Card.Title>Title</Card.Title>
          <Card.Description>Description</Card.Description>
        </Card.Header>
        <Card.Content>Content</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    const slots = [...container.querySelectorAll("[data-slot]")].map((node) =>
      node.getAttribute("data-slot"),
    );
    expect(slots).toEqual([
      "card",
      "card-header",
      "card-title",
      "card-description",
      "card-content",
      "card-footer",
    ]);
  });

  it("makes the title an h3 by default, keeping HeroUI's title class", () => {
    render(
      <Card>
        <Card.Title>Title</Card.Title>
      </Card>,
    );
    const title = screen.getByRole("heading", { level: 3, name: "Title" });
    expect(title.tagName).toBe("H3");
    expect(title.classList.contains("card__title")).toBe(true);
  });

  it.each(HeadingLevel)(
    "places the title at level %s with the caller's id and HeroUI's class",
    (level) => {
      render(
        <Card>
          <Card.Title level={level} id="t">
            Title
          </Card.Title>
        </Card>,
      );
      const title = screen.getByRole("heading", { level, name: "Title" });
      expect(title.tagName).toBe(`H${level}`);
      expect(title.id).toBe("t");
      expect(title.classList.contains("card__title")).toBe(true);
    },
  );

  it("gives its level to the components inside, except when transparent", () => {
    const { rerender } = render(
      <Card variant="secondary">
        <LevelProbe />
      </Card>,
    );
    expect(screen.getByTestId("level").textContent).toBe("secondary");
    rerender(
      <Card variant="transparent">
        <LevelProbe />
      </Card>,
    );
    // HeroUI's rule, kept because the root is HeroUI's: a transparent card draws no surface to sit on.
    expect(screen.getByTestId("level").textContent).toBe("none");
  });

  it("is named as an article by its title, and passes the refs through without a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const rootRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    render(
      <Card ref={rootRef} role="article" aria-labelledby="name">
        <Card.Title ref={titleRef} id="name">
          Order summary
        </Card.Title>
      </Card>,
    );
    const article = screen.getByRole("article", { name: "Order summary" });
    expect(rootRef.current).toBe(article);
    expect(titleRef.current).toBe(screen.getByRole("heading", { name: "Order summary" }));
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("types: extends the contracts and refuses HeroUI's own names", () => {
    expectTypeOf<CardProps>().toExtend<CardContractProps>();
    expectTypeOf<CardTitleProps>().toExtend<CardTitleContractProps>();
    // @ts-expect-error the title's level owns the element, so `render` is not a prop
    render(<Card.Title render={(props) => <h2 {...props} />}>Title</Card.Title>); // oxlint-disable-line jsx-a11y/heading-has-content -- reason: a type test; the spread props carry the content
    // @ts-expect-error a heading level is 1 to 6
    render(<Card.Title level={7}>Title</Card.Title>);
    // @ts-expect-error the body is `Card.Content` on both runtimes; HeroUI Native's name is not part of the contract
    expect(Card.Body).toBeUndefined();
    // @ts-expect-error the root is the compound itself, not a `Card.Root` part
    expect(Card.Root).toBeUndefined();
  });
});

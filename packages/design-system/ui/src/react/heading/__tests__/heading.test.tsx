/**
 * Stackra file contract:
 * Purpose: proves the web Heading renders the `h<level>` element for every level, draws the style `type` (default
 *          the level's), maps tone, alignment, truncation and language as Text does, and names its section when it
 *          carries an id.
 * Boundary: jsdom with the real @heroui/react; no theme CSS is loaded, so classes, elements and attributes are
 *          checked, not computed styles (the e2e checks those). React Aria warns in development when the element
 *          differs from the style's own, which is the point of the contract, so those cases silence it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-018 sta-350:P-010 sta-350:P-011
import { render, screen } from "@testing-library/react";

import { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { HeadingContractProps } from "#contracts/types/heading-contract-props.type";
import { Heading, type HeadingProps } from "#react/heading/heading";

describe("Heading (web)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(HeadingLevel)("level %s is an h<level> in its own style", (level) => {
    render(<Heading level={level}>Title</Heading>);
    const heading = screen.getByRole("heading", { level });
    expect(heading.localName).toBe(`h${level}`);
    expect(heading.classList.contains(`typography--h${level}`)).toBe(true);
  });

  it("keeps the element of the level when the style differs", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Heading level={1} type="h3">
        Title
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.localName).toBe("h1");
    expect(heading.classList.contains("typography--h3")).toBe(true);
    expect(heading.dataset["type"]).toBe("h3");
  });

  it("maps tone, alignment, truncation and language as Text does", () => {
    render(
      <Heading level={2} tone="muted" align="center" isTruncated lang="ar">
        عنوان
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.classList.contains("typography--color-muted")).toBe(true);
    expect(heading.classList.contains("typography--align-center")).toBe(true);
    expect(heading.classList.contains("typography--truncate")).toBe(true);
    expect(heading.getAttribute("lang")).toBe("ar");
    expect(heading.getAttribute("dir")).toBe("rtl");
  });

  it("draws a status tone with the theme's colour utility", () => {
    render(
      <Heading level={2} tone="success" className="mt-2">
        Done
      </Heading>,
    );
    const names = [...screen.getByRole("heading", { level: 2 }).classList];
    expect(names).toContain("text-success");
    expect(names.indexOf("text-success")).toBeLessThan(names.indexOf("mt-2"));
  });

  it("passes the id on, so a section is named by its heading", () => {
    render(
      <section aria-labelledby="x">
        <Heading id="x" level={2}>
          Title
        </Heading>
      </section>,
    );
    expect(screen.getByRole("region", { name: "Title" })).toBeTruthy();
  });

  it("extends its contract, requires the level and refuses the element choice", () => {
    expectTypeOf<HeadingProps>().toExtend<HeadingContractProps>();
    // @ts-expect-error the level is required
    void (<Heading>Title</Heading>);
    // @ts-expect-error the level owns the element
    void (<Heading level={1} render={(props) => <h2 {...props} />} />);
  });
});

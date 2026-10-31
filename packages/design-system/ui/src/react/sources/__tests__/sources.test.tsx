/**
 * Stackra file contract:
 * Purpose: proves the web Sources toggle counts its sources and opens to a named list of chips.
 * Boundary: jsdom with the real HeroUI Disclosure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Sources } from "#react/sources/sources";

const SOURCES = [
  { key: "a", href: "https://example.com/a", title: "Menu" },
  { key: "b", href: "https://example.org/b" },
  { key: "c", title: "Q3.pdf" },
];

describe("Sources (web)", () => {
  it("counts the sources and opens to the list", () => {
    render(<Sources sources={SOURCES} />);
    const trigger = screen.getByRole("button", { name: "3 sources" });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("list", { name: "Sources" }).querySelectorAll("li")).toHaveLength(3);
  });
});

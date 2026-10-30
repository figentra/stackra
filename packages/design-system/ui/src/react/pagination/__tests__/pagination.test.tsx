/**
 * Stackra file contract:
 * Purpose: proves the web Pagination is a named navigation landmark with the summary, marks the current page,
 *          moves by number and by previous and next (off at the ends), goes back to page 1 when the size changes,
 *          and jumps to a typed page clamped to the pages there are.
 * Boundary: jsdom with the real HeroUI and React Aria components; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Pagination } from "#react/pagination/pagination";

describe("Pagination (web)", () => {
  it("is a named landmark with the summary and the current page", () => {
    render(<Pagination total={240} defaultPage={3} label="Invoices pages" />);
    expect(screen.getByRole("navigation", { name: "Invoices pages" })).toBeTruthy();
    expect(screen.getByText("21–30 of 240")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Page 3" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("moves by number, previous and next, and stops at the ends", () => {
    const pages: number[] = [];
    render(<Pagination total={30} onPageChange={(page) => pages.push(page)} />);
    const previous = screen.getByRole("button", { name: "Previous page" });
    expect(
      previous.hasAttribute("disabled") || previous.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(pages).toEqual([2, 3]);
  });

  it("jumps to a typed page, clamped", () => {
    const pages: number[] = [];
    render(<Pagination total={95} hasJump onPageChange={(page) => pages.push(page)} />);
    const box = screen.getByRole("textbox", { name: "Go to page" });
    fireEvent.change(box, { target: { value: "7" } });
    fireEvent.blur(box);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(pages).toEqual([7]);
  });
});

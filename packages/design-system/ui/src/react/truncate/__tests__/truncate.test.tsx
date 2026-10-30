/**
 * Stackra file contract:
 * Purpose: proves the web Truncate clamps the text, offers Show more only when the text is cut, and opens it with
 *          `aria-expanded` and `aria-controls`.
 * Boundary: jsdom, where layout is faked by stubbing the paragraph's scroll and client heights.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Truncate } from "#react/truncate/truncate";

describe("Truncate (web)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("offers Show more when cut, and opens the text", () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(60);
    const { container } = render(<Truncate lines={2}>A long description of the product.</Truncate>);
    const text = container.querySelector("p");
    expect(text?.style.webkitLineClamp).toBe("2");
    const more = screen.getByRole("button", { name: "Show more" });
    expect(more.getAttribute("aria-controls")).toBe(text?.id);
    fireEvent.click(more);
    expect(screen.getByRole("button", { name: "Show less" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("shows no button when the text fits", () => {
    render(<Truncate>Short.</Truncate>);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

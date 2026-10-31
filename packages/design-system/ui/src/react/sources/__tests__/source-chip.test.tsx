/**
 * Stackra file contract:
 * Purpose: proves the web SourceChip links a web source in a new tab under its domain, never follows a non-web link,
 *          and draws a document as plain text.
 * Boundary: jsdom with the real HeroUI link.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { SourceChip } from "#react/sources/source-chip";

describe("SourceChip (web)", () => {
  it("links a web source in a new tab, named by its domain", () => {
    render(<SourceChip source={{ key: "a", href: "https://www.example.com/menu" }} />);
    const link = screen.getByRole("link", { name: "example.com (opens in a new tab)" });
    expect(link.getAttribute("href")).toBe("https://www.example.com/menu");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toBe("Eexample.com");
  });

  it("never follows a link that is not a web address", () => {
    // oxlint-disable-next-line no-script-url -- reason: the case under test
    render(<SourceChip source={{ key: "x", title: "Report", href: "javascript:alert(1)" }} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Report")).toBeTruthy();
  });

  it("makes a document with a preview a button", () => {
    render(<SourceChip source={{ key: "d", title: "Q3.pdf", description: "Quarterly report" }} />);
    expect(screen.getByRole("button", { name: "Q3.pdf, Document" })).toBeTruthy();
  });
});

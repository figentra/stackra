/**
 * Stackra file contract:
 * Purpose: proves the web PackageList is a named list cut at `maxVisible` rows, fades only when rows were left out,
 *          links a package that has an address (reached by Tab), and keeps package names left-to-right in Arabic.
 * Boundary: jsdom with real HeroUI; classes are checked, not computed styles.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060; ADR 0022 (test placement); STA-2041.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { PackageList } from "#react/package-list/package-list";

const ITEMS = [
  { name: "@stackra/actions", description: "Typed, authorised actions.", href: "/actions" },
  { name: "@stackra/container", description: "Dependency injection." },
  { name: "@stackra/ui", description: "The design system." },
];

describe("PackageList (web)", () => {
  it("is a named list cut at maxVisible, faded when rows were left out", () => {
    render(<PackageList label="Stackra packages" items={ITEMS} maxVisible={2} />);
    const list = screen.getByRole("list", { name: "Stackra packages" });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(list.className).toContain("mask-image");
  });

  it("does not fade a list shown whole, and Tab reaches the link", () => {
    render(<PackageList label="Packages" items={ITEMS} />);
    expect(screen.getByRole("list").className).not.toContain("mask-image");
    const link = screen.getByRole("link", { name: "@stackra/actions" });
    expect(link.tabIndex).toBe(0);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("keeps package names left-to-right in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <PackageList
          label="الحزم"
          items={[{ name: "@stackra/ui", description: "نظام التصميم." }]}
        />
      </I18nProvider>,
    );
    expect(screen.getByText("@stackra/ui").getAttribute("dir")).toBe("ltr");
  });
});

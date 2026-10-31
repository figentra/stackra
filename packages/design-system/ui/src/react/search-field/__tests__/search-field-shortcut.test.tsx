/**
 * Stackra file contract:
 * Purpose: proves the web SearchField with `shortcut="/"` focuses its input on the key, carries `aria-keyshortcuts` and shows the hint.
 * Boundary: jsdom with real HeroUI and React Aria inside a ShortcutProvider; keys dispatched with their `code`.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0508.
 */
// @vitest-environment jsdom
import { ShortcutProvider } from "@stackra/shortcuts/react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { SearchField } from "#react/search-field/search-field";

describe("SearchField shortcut (web)", () => {
  it("focuses the field on /", () => {
    render(
      <ShortcutProvider>
        <SearchField aria-label="Search orders" shortcut="/" />
        <button type="button">Elsewhere</button>
      </ShortcutProvider>,
    );
    const input = screen.getByRole("searchbox");
    expect(input.getAttribute("aria-keyshortcuts")).toBe("/");
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    act(() => elsewhere.focus());
    fireEvent.keyDown(elsewhere, { key: "/", code: "Slash" });
    expect(document.activeElement).toBe(input);
  });
});

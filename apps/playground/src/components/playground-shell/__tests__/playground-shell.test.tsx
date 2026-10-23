/**
 * Stackra file contract:
 * Purpose: proves the playground shell takes the colour scheme and locale from the URL, applies them through the
 *          DesignSystemProvider, writes a switch back to the URL, and draws its landmarks around the page.
 * Boundary: a memory router in jsdom with a stubbed matchMedia; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010
import { act, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { PlaygroundShell } from "#src/components/playground-shell";

const root = document.documentElement;

function renderShell(url: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PlaygroundShell pages={[{ path: "/a", title: "Page A" }]} />,
        children: [{ path: "/", element: <h1>Child page</h1> }],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("PlaygroundShell", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies the scheme and locale from the URL", () => {
    renderShell("/?scheme=dark&locale=ar");
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dir).toBe("rtl");
    expect(root.lang).toBe("ar");
    expect(screen.getByRole("radio", { name: "Dark" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("link", { name: "Page A" }).getAttribute("href")).toBe(
      "/a?scheme=dark&locale=ar",
    );
  });

  it("falls back to the system scheme and English for unknown values", () => {
    renderShell("/?scheme=sepia&locale=xx");
    expect(root.dataset["theme"]).toBe("light");
    expect(root.dir).toBe("ltr");
    expect(screen.getByRole("radio", { name: "System" }).getAttribute("aria-checked")).toBe("true");
  });

  it("writes a switch back to the URL", () => {
    const router = renderShell("/");
    act(() => screen.getByRole("radio", { name: "Dark" }).click());
    act(() => screen.getByRole("radio", { name: /العربية/ }).click());
    expect(router.state.location.search).toBe("?scheme=dark&locale=ar");
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dir).toBe("rtl");
  });

  it("draws the banner, navigation and main landmarks around the page", () => {
    renderShell("/");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("Child page");
  });
});

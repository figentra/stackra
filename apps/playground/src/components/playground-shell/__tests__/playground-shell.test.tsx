/**
 * Stackra file contract:
 * Purpose: proves the playground shell takes the colour scheme and locale from the URL, applies them through the
 *          DesignSystemProvider, writes a switch back to the URL, marks the selected choice beyond its fill, keeps
 *          theme-color in step, declares its UI English, moves focus to the h1 on navigation, groups its navigation by category, and draws its landmarks.
 * Boundary: a memory router in jsdom with a stubbed matchMedia; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010
import { act, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { PlaygroundShell } from "#src/components/playground-shell";

const root = document.documentElement;

function renderShell(url: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <PlaygroundShell pages={[{ path: "/a", title: "Page A", category: "Foundations" }]} />
        ),
        children: [
          { path: "/", element: <h1>Child page</h1> },
          { path: "/a", element: <h1>Page A</h1> },
        ],
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

  it("marks the selected choice with a check mark, not by its fill alone", () => {
    renderShell("/?scheme=dark&locale=en");
    const dark = screen.getByRole("radio", { name: "Dark" });
    expect(dark.querySelector('[data-testid="selected-mark"]')).toBeTruthy();
    expect(screen.getAllByTestId("selected-mark")).toHaveLength(2); // one per group
    expect(dark.className).toContain("--toggle-button-bg-selected:var(--accent)");
  });

  it("keeps theme-color in the background colour of the scheme on screen", () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
    renderShell("/?scheme=dark");
    expect(meta.content).toBe("#0B0D0F");
    act(() => screen.getByRole("radio", { name: "Light" }).click());
    expect(meta.content).toBe("#F5F6F3");
    meta.remove();
  });

  it("declares its UI English while the document carries the chosen locale", () => {
    renderShell("/?locale=ar");
    expect(root.lang).toBe("ar");
    expect(screen.getByRole("main").closest("[lang]")?.getAttribute("lang")).toBe("en");
  });

  it("moves focus to the new page's h1 on a client-side navigation, not on the first load", async () => {
    const router = renderShell("/");
    expect(document.activeElement).toBe(document.body);
    await act(() => router.navigate("/a"));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "Page A" }));
  });

  it("groups the navigation by category", () => {
    renderShell("/");
    const navigation = within(screen.getByRole("navigation", { name: "Pages" }));
    expect(
      within(navigation.getByRole("list", { name: "Foundations" })).getByRole("link").textContent,
    ).toBe("Page A");
    expect(navigation.queryByRole("list", { name: "Typography" })).toBeNull();
  });

  it("draws the banner, navigation and main landmarks around the page", () => {
    renderShell("/");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("Child page");
  });
});

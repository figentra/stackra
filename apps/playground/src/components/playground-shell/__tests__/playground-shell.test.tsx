/**
 * Stackra file contract:
 * Purpose: proves the playground shell takes the colour scheme and locale from the URL, applies them through the
 *          DesignSystemProvider, writes a switch back to the URL, keeps every choice made before the next render, marks
 *          the selected choice beyond its fill, keeps theme-color in step, declares its UI English, moves focus to the
 *          h1 on navigation, groups its navigation by category with the Free pages before the Pro pages (badged),
 *          filters it by tier from the URL, and draws its landmarks, leaving out `main` for a page that draws its own.
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
          <PlaygroundShell
            pages={[
              { path: "/a", title: "Page A", category: "Foundations" },
              { path: "/pro-b", title: "Page B", category: "Foundations" },
              { path: "/pro-c", title: "Page C", category: "Charts", ownsMain: true },
              { path: "/d", title: "Page D", category: "Charts" },
            ]}
          />
        ),
        children: [
          { path: "/", element: <h1>Child page</h1> },
          { path: "/a", element: <h1>Page A</h1> },
          { path: "/pro-c", element: <h1>Page C</h1> },
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

  it("keeps every choice made before the next render, and follows a URL changed elsewhere", () => {
    const router = renderShell("/?scheme=light&locale=en");
    // One act: the three clicks land before the shell renders again, as quick clicks can in a browser.
    act(() => {
      screen.getByRole("radio", { name: "Dark" }).click();
      screen.getByRole("radio", { name: /العربية/ }).click();
      screen.getByRole("radio", { name: "Pro" }).click();
    });
    expect(router.state.location.search).toBe("?scheme=dark&locale=ar&tier=pro");
    act(() => void router.navigate("/?scheme=light&locale=en"));
    act(() => screen.getByRole("radio", { name: "Dark" }).click());
    expect(router.state.location.search).toBe("?scheme=dark&locale=en");
  });

  it("marks the selected choice with a check mark, not by its fill alone", () => {
    renderShell("/?scheme=dark&locale=en");
    const dark = screen.getByRole("radio", { name: "Dark" });
    expect(dark.querySelector('[data-testid="selected-mark"]')).toBeTruthy();
    expect(screen.getAllByTestId("selected-mark")).toHaveLength(3); // one per group
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

  it("groups the navigation by category, in category order, and hides empty categories", () => {
    renderShell("/");
    const navigation = within(screen.getByRole("navigation", { name: "Pages" }));
    const lists = [...screen.getByRole("navigation", { name: "Pages" }).querySelectorAll("ul")];
    expect(lists.map((list) => list.getAttribute("aria-label"))).toEqual(["Foundations", "Charts"]);
    expect(navigation.queryByRole("list", { name: "Actions" })).toBeNull();
  });

  it("lists the Free pages before the Pro pages and marks Pro in the link's name", () => {
    renderShell("/");
    const foundations = within(screen.getByRole("list", { name: "Foundations" }));
    expect(foundations.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Page A",
      "Page B, Pro",
    ]);
    expect(foundations.getByRole("link", { name: "Page B, Pro" })).toBeTruthy();
    expect(foundations.getByRole("link", { name: "Page A" })).toBeTruthy();
  });

  it("filters the navigation by tier from the tier search param, empty categories hidden", () => {
    renderShell("/?tier=pro");
    expect(screen.getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByRole("link", { name: "Page A" })).toBeNull();
    expect(screen.getByRole("link", { name: "Page B, Pro" })).toBeTruthy();
  });

  it("filters to the Free pages, and writes the choice back to the URL", () => {
    const router = renderShell("/?scheme=dark");
    const group = within(screen.getByRole("radiogroup", { name: "Show pages by tier" }));
    expect(group.getByRole("radio", { name: "All" }).getAttribute("aria-checked")).toBe("true");
    act(() => group.getByRole("radio", { name: "Free" }).click());
    expect(router.state.location.search).toBe("?scheme=dark&tier=free");
    expect(screen.queryByRole("link", { name: /Pro$/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Page A" })).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Charts" })?.textContent).toBe("Page D");
  });

  it("falls back to All for an unknown tier", () => {
    renderShell("/?tier=gold");
    expect(screen.getByRole("radio", { name: "All" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getAllByRole("link", { name: /Page/ })).toHaveLength(4);
  });

  it("draws the banner, navigation and main landmarks around the page", () => {
    renderShell("/");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("Child page");
  });

  it("adds no main landmark for a page that draws its own, keeping the skip target", () => {
    renderShell("/pro-c");
    expect(screen.queryByRole("main")).toBeNull();
    expect(document.getElementById("main")?.textContent).toBe("Page C");
  });
});

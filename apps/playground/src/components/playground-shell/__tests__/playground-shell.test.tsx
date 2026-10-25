/**
 * Stackra file contract:
 * Purpose: proves the playground shell takes the colour scheme and locale from the URL, applies them through the
 *          DesignSystemProvider, writes a switch back to the URL, keeps every choice made before the next render,
 *          marks the selected choice beyond its fill, keeps theme-color in step, runs the document in the material
 *          mode from the URL, declares its UI English, moves focus to the h1 on navigation, draws a component
 *          page's category strip (current page marked) and its previous and next links, opens the command palette
 *          from its button and from ⌘K, and draws its landmarks, leaving out `main` for a page that draws its own.
 * Boundary: a memory router in jsdom with a stubbed matchMedia and a stubbed `<dialog>` (jsdom has no showModal);
 *          no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-422:FR-001 sta-422:P-001
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { PlaygroundShell } from "#src/components/playground-shell";
import type { PageLink } from "#src/types/page-link.type";

const root = document.documentElement;

const PAGES: readonly PageLink[] = [
  { path: "/a", title: "Page A", category: "Foundations" },
  { path: "/b", title: "Page B", category: "Actions" },
  { path: "/c", title: "Page C", category: "Actions" },
  { path: "/pro-d", title: "Page D", category: "Charts", ownsMain: true },
];

// jsdom has no modal dialog: opening and closing only flip `open`.
function showModal(this: HTMLDialogElement) {
  this.open = true;
}

function close(this: HTMLDialogElement) {
  this.open = false;
}

const dialog = () => document.querySelector("dialog");

function renderShell(url: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PlaygroundShell pages={PAGES} />,
        children: [
          { path: "/", element: <h1>Child page</h1> },
          ...PAGES.map(({ path, title }) => ({ path, element: <h1>{title}</h1> })),
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
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies the scheme and locale from the URL", () => {
    renderShell("/b?scheme=dark&locale=ar");
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dir).toBe("rtl");
    expect(root.lang).toBe("ar");
    expect(screen.getByRole("radio", { name: "Dark" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("link", { name: "Page C" }).getAttribute("href")).toBe(
      "/c?scheme=dark&locale=ar",
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
    // One act: both clicks land before the shell renders again, as quick clicks can in a browser.
    act(() => {
      screen.getByRole("radio", { name: "Dark" }).click();
      screen.getByRole("radio", { name: /العربية/ }).click();
    });
    expect(router.state.location.search).toBe("?scheme=dark&locale=ar");
    act(() => void router.navigate("/?scheme=light&locale=en"));
    act(() => screen.getByRole("radio", { name: "Dark" }).click());
    expect(router.state.location.search).toBe("?scheme=dark&locale=en");
  });

  it("marks the selected choice with a check mark, not by its fill alone", () => {
    renderShell("/?scheme=dark&locale=en");
    const dark = screen.getByRole("radio", { name: "Dark" });
    expect(dark.querySelector('[data-testid="selected-mark"]')).toBeTruthy();
    expect(screen.getAllByTestId("selected-mark")).toHaveLength(2); // one per group: scheme and language
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

  it("draws a component page's category strip with the current page marked", () => {
    renderShell("/b");
    const strip = within(screen.getByRole("navigation", { name: "Pages" }));
    const links = within(strip.getByRole("list", { name: "Actions" })).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Page B", "Page C"]);
    expect(links[0]?.getAttribute("aria-current")).toBe("page");
    expect(links[1]?.getAttribute("aria-current")).toBeNull();
    expect(strip.getByRole("link", { name: "All components" }).getAttribute("href")).toBe(
      "/#components",
    );
  });

  it("links a component page to the pages before and after it", () => {
    renderShell("/b");
    const pager = within(screen.getByRole("navigation", { name: "Previous and next page" }));
    expect(pager.getByRole("link", { name: /Previous.*Page A/ }).getAttribute("href")).toBe("/a");
    expect(pager.getByRole("link", { name: /Next.*Page C/ }).getAttribute("href")).toBe("/c");
  });

  it("draws no category strip or pager on the index", () => {
    renderShell("/");
    expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Previous and next page" })).toBeNull();
  });

  it("opens the command palette from its button and from ⌘K", () => {
    renderShell("/");
    expect(dialog()?.open).toBe(false);
    act(() => screen.getByRole("button", { name: /Search components/ }).click());
    expect(dialog()?.open).toBe(true);
    act(() => {
      dialog()?.close();
      fireEvent(dialog() as HTMLDialogElement, new Event("close"));
    });
    expect(dialog()?.open).toBe(false);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(dialog()?.open).toBe(true);
  });

  it("runs the document in the material mode from the URL, glass when none is named, and writes a switch back", () => {
    const router = renderShell("/?material=liquid");
    expect(root.dataset["material"]).toBe("liquid");
    expect(screen.getByRole("radio", { name: "Liquid" }).getAttribute("aria-checked")).toBe("true");
    act(() => screen.getByRole("radio", { name: "Solid" }).click());
    expect(router.state.location.search).toBe("?material=solid");
    expect(root.dataset["material"]).toBe("solid");
  });

  it("falls back to the glass material for an unknown mode", () => {
    renderShell("/?material=chrome");
    expect(root.dataset["material"]).toBe("glass");
  });

  it("folds the display settings behind a button that says whether they are open", () => {
    renderShell("/");
    const toggle = screen.getByRole("button", { name: "Scheme and language" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe("display-settings");
    act(() => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("draws the banner, display settings and main landmarks around the page", () => {
    renderShell("/");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("Child page");
  });

  it("adds no main landmark for a page that draws its own, keeping the skip target", () => {
    renderShell("/pro-d");
    expect(screen.queryByRole("main")).toBeNull();
    const target = document.getElementById("main") as HTMLElement;
    expect(within(target).getByRole("heading", { level: 1, name: "Page D" })).toBeTruthy();
  });
});

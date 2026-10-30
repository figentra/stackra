/**
 * Stackra file contract:
 * Purpose: proves the playground shell takes the colour scheme and locale from the URL, applies them through the
 *          DesignSystemProvider, writes a switch back to the URL, keeps every choice made before the next render,
 *          marks the selected choice beyond its fill, keeps theme-color in step, runs the document in the material
 *          mode from the URL, speaks the chosen locale (Arabic catalogues live, English fallback), moves focus to the h1 on navigation, draws a component
 *          page's sidebar (current page marked) and its "On this page" rail, opens the command palette
 *          from its button and from ⌘K, and draws its landmarks, leaving out `main` for a page that draws its own.
 * Boundary: a memory router in jsdom with a stubbed matchMedia and a stubbed `<dialog>` (jsdom has no showModal);
 *          no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-010 sta-422:FR-001 sta-422:P-001
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { bySlug, type ComponentEntry } from "@stackra/showcase";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { PlaygroundShell } from "#src/components/playground-shell";
import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import type { PageLink } from "#src/types/page-link.type";

/** A registry entry the test needs. */
const entry = (tier: ComponentEntry["tier"], slug: string): ComponentEntry => {
  const found = bySlug(tier, slug);
  if (!found) throw new Error(`${tier}/${slug} is not registered`);
  return found;
};

const root = document.documentElement;

const PAGES: readonly (PageLink & { title: string })[] = [
  { path: "/button", title: "Page A", entry: entry("free", "button") },
  { path: "/icon-button", title: "Page B", entry: entry("free", "icon-button") },
  { path: "/app-shell", title: "Page D", entry: entry("free", "app-shell"), ownsMain: true },
];

// jsdom has no modal dialog: opening and closing only flip `open`.
function showModal(this: HTMLDialogElement) {
  this.open = true;
}

function close(this: HTMLDialogElement) {
  this.open = false;
}

const dialog = () => document.querySelector("dialog");

/** Opens the Display popover, where every display setting lives, by its button's name in the shell's language. */
const openDisplay = (name = "Display") => act(() => screen.getByRole("button", { name }).click());

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
  // The icons come from the app's root, as in main.tsx.
  render(
    <PlaygroundIcons>
      <RouterProvider router={router} />
    </PlaygroundIcons>,
  );
  return router;
}

describe("PlaygroundShell", () => {
  beforeEach(() => {
    stubBrowserApis();
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies the scheme and locale from the URL", async () => {
    renderShell("/button?scheme=dark&locale=ar");
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dir).toBe("rtl");
    expect(root.lang).toBe("ar");
    expect(
      within(screen.getByRole("navigation", { name: "المكونات" }))
        .getByRole("link", { name: /زر بأيقونة/ })
        .getAttribute("href"),
    ).toBe("/icon-button?scheme=dark&locale=ar");
    openDisplay("العرض");
    expect((await screen.findByRole("radio", { name: "داكن" })).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("falls back to the system scheme and English for unknown values", () => {
    renderShell("/?scheme=sepia&locale=xx");
    expect(root.dataset["theme"]).toBe("light");
    expect(root.dir).toBe("ltr");
    openDisplay();
    expect(screen.getByRole("radio", { name: "System" }).getAttribute("aria-checked")).toBe("true");
  });

  it("writes a switch back to the URL", () => {
    const router = renderShell("/");
    openDisplay();
    act(() => screen.getByRole("radio", { name: "Dark" }).click());
    act(() => screen.getByRole("radio", { name: /العربية/ }).click());
    expect(router.state.location.search).toBe("?scheme=dark&locale=ar");
    expect(root.dataset["theme"]).toBe("dark");
    expect(root.dir).toBe("rtl");
  });

  it("keeps every choice made before the next render, and follows a URL changed elsewhere", () => {
    const router = renderShell("/?scheme=light&locale=en");
    openDisplay();
    // One act: both clicks land before the shell renders again, as quick clicks can in a browser.
    act(() => {
      screen.getByRole("radio", { name: "Dark" }).click();
      screen.getByRole("radio", { name: /العربية/ }).click();
    });
    expect(router.state.location.search).toBe("?scheme=dark&locale=ar");
    act(() => void router.navigate("/?scheme=light&locale=en"));
    if (!screen.queryByRole("radio", { name: "Dark" })) openDisplay();
    act(() => screen.getByRole("radio", { name: "Dark" }).click());
    expect(router.state.location.search).toBe("?scheme=dark&locale=en");
  });

  it("shows selection through ToggleButtonGroup's own state, with no extra mark that widens the toggle", () => {
    renderShell("/?scheme=dark&locale=en");
    openDisplay();
    const dark = screen.getByRole("radio", { name: "Dark" });
    expect(dark.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Light" }).getAttribute("aria-checked")).toBe("false");
    expect(dark.querySelectorAll("svg")).toHaveLength(1); // the scheme icon only, no selected mark
  });

  it("keeps theme-color in the background colour of the scheme on screen", () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
    renderShell("/?scheme=dark");
    expect(meta.content).toBe("#0B0D0F");
    openDisplay();
    act(() => screen.getByRole("radio", { name: "Light" }).click());
    expect(meta.content).toBe("#F5F6F3");
    meta.remove();
  });

  it("speaks the chosen locale: the document's language and the shell's words switch together", async () => {
    renderShell("/?locale=ar");
    expect(root.lang).toBe("ar");
    expect(screen.getByRole("main").closest("[lang]")).toBe(root);
    openDisplay("العرض");
    expect(await screen.findByRole("toolbar", { name: "إعدادات العرض" })).toBeTruthy();
    act(() => screen.getByRole("radio", { name: /English/ }).click());
    if (!screen.queryByRole("toolbar", { name: "Display settings" })) openDisplay();
    expect(await screen.findByRole("toolbar", { name: "Display settings" })).toBeTruthy();
  });

  it("moves focus to the new page's h1 on a client-side navigation, not on the first load", async () => {
    const router = renderShell("/");
    expect(document.activeElement).toBe(document.body);
    await act(() => router.navigate("/button"));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "Page A" }));
  });

  it("draws a component page's sidebar with the current page marked, A-Z", () => {
    renderShell("/button");
    const sidebar = within(screen.getByRole("navigation", { name: "Components" }));
    // The sidebar groups pages by category; the current page's group is open.
    const group = sidebar.getByRole("link", { name: "Button" }).closest("ul") as HTMLElement;
    const free = within(group).getAllByRole("link");
    const titles = free.map((link) => link.textContent ?? "");
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    expect(sidebar.getByRole("link", { name: "Button" }).getAttribute("aria-current")).toBe("page");
    expect(
      sidebar.getByRole("link", { name: /Icon button/ }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("lights Components in the top bar on a component page, not Docs", () => {
    renderShell("/button");
    const site = within(screen.getByRole("banner")).getByRole("navigation", { name: "Site" });
    expect(
      within(site).getByRole("link", { name: "Components" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(site).getByRole("link", { name: "Docs" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("keeps one sidebar group open at a time, the current page's first", () => {
    renderShell("/button");
    const sidebar = within(screen.getByRole("navigation", { name: "Components" }));
    const expanded = () =>
      sidebar.getAllByRole("button", { expanded: true }).map((button) => button.textContent ?? "");
    expect(expanded()).toHaveLength(1);
    const [opened] = expanded();
    const other = sidebar.getAllByRole("button", { expanded: false })[0] as HTMLElement;
    act(() => other.click());
    expect(expanded()).toEqual([other.textContent]);
    expect(expanded()).not.toContain(opened);
  });

  it("draws the rail of a component page's sections", () => {
    renderShell("/button");
    // The rail (wide screens) and the menu at the top of the page (from lg to xl), one shown at a time.
    const [menu, railNav] = screen.getAllByRole("navigation", { name: "On this page" });
    if (!menu || !railNav) throw new Error("the rail and the menu are both drawn");
    const rail = within(railNav);
    // A plain in-page anchor: it keeps the address's path and search params.
    expect(rail.getByRole("link", { name: "API Reference" }).getAttribute("href")).toBe("#api");
    expect(rail.getByRole("link", { name: "Import" }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(rail.getByRole("link", { name: "Back to top" })).toBeTruthy();
    expect(within(menu).getByText("On this page", { selector: "summary span" })).toBeTruthy();
  });

  it("draws no sidebar or rail on the index", () => {
    renderShell("/");
    expect(screen.queryByRole("navigation", { name: "Components" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "On this page" })).toBeNull();
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
    openDisplay();
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
    const toggle = screen.getByRole("button", { name: "Display" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("toolbar", { name: "Display settings" })).toBeNull();
    act(() => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
  });

  it("draws the banner, display settings and main landmarks around the page", () => {
    renderShell("/");
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("main").textContent).toBe("Child page");
    openDisplay();
    expect(screen.getByRole("toolbar", { name: "Display settings" })).toBeTruthy();
  });

  it("adds no main landmark for a page that draws its own, keeping the skip target", () => {
    renderShell("/app-shell");
    expect(screen.queryByRole("main")).toBeNull();
    const target = document.getElementById("main") as HTMLElement;
    expect(within(target).getByRole("heading", { level: 1, name: "Page D" })).toBeTruthy();
  });
});

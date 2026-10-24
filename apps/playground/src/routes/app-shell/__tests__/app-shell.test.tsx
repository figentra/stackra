/**
 * Stackra file contract:
 * Purpose: proves the app-shell page titles the document, draws every shell embedded (no second main landmark or skip
 *          link), keeps every id and navigation landmark name unique, shows the column's sidebar with its toggle that
 *          folds it, a shell with no sidebar and no button, an Arabic shell in a right-to-left block, and a live shell
 *          whose button opens the drawer (the sidebar drawn in full inside it, with no toggle), reports the state, and
 *          closes it on choosing an entry and on the Close button.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a memory router; the theme CSS is not
 *           loaded, so every shell shows its column and its button (the breakpoint is a stylesheet's), and the widths
 *           and the drawer's take-over below the breakpoint are the e2e suite's. A role query finds nothing outside an
 *           open drawer (React Aria hides the page behind it), so each case holds what it needs before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0314; ADR 0022 (test placement).
 */
// @covers sta-350:FR-162
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { AppShell } from "#src/routes/app-shell/app-shell";
import { AppShellRoute } from "#src/routes/app-shell/app-shell.route";

function renderPage(url = "/app-shell?scheme=dark&locale=ar") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <AppShell />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const press = (element: HTMLElement) => act(() => element.click());

describe("App shell page", () => {
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

  it("titles the page and the document, and sits at /app-shell under Shell", () => {
    renderPage();
    expect(AppShellRoute.path).toBe("/app-shell");
    expect(AppShellRoute.category).toBe("Shell");
    expect(screen.getByRole("heading", { level: 1, name: "App shell" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("App shell · Stackra Playground");
  });

  it("draws every shell embedded: no main landmark and no skip link", () => {
    renderPage();
    expect(screen.queryByRole("main")).toBeNull();
    expect(screen.queryByRole("link", { name: "Skip to main content" })).toBeNull();
    expect(document.querySelectorAll("[id$='-main']")).toHaveLength(5);
  });

  it("keeps every id unique and names every navigation landmark once", () => {
    renderPage();
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = screen.getAllByRole("navigation").map((nav) => nav.getAttribute("aria-label"));
    expect(names).toHaveLength(4);
    expect(new Set(names).size).toBe(names.length);
  });

  it("shows the sidebar column with its toggle, which folds it", () => {
    renderPage();
    const frame = section("Frame");
    const sidebar = frame.getByRole("navigation", { name: "Frame navigation" }).parentElement;
    expect(sidebar?.hasAttribute("data-collapsed")).toBe(false);
    press(frame.getByRole("button", { name: "Collapse sidebar" }));
    expect(sidebar?.getAttribute("data-collapsed")).toBe("true");
    expect(frame.getByRole("button", { name: "Expand sidebar" })).toBeTruthy();
  });

  it("puts the page's heading under the section's heading, inside the shell's region", () => {
    renderPage();
    const frame = section("Frame");
    const heading = frame.getByRole("heading", { level: 3, name: "Orders" });
    expect(heading.closest("#app-shell-frame-main")).toBeTruthy();
  });

  it("draws a shell with no sidebar as a header over the page, with no button", () => {
    renderPage();
    const bare = section("Without a sidebar");
    expect(bare.queryByRole("navigation")).toBeNull();
    expect(bare.queryByRole("button")).toBeNull();
    expect(bare.getByRole("heading", { level: 3, name: "Dashboard" })).toBeTruthy();
  });

  it("draws the Arabic shell in a right-to-left block", () => {
    renderPage();
    const nav = section("Arabic").getByRole("navigation", { name: "تنقل الإطار" });
    expect(nav.closest("[dir='rtl']")?.getAttribute("lang")).toBe("ar");
  });

  it("opens the drawer from the live button with the sidebar in full, and reports the state", () => {
    renderPage();
    const live = section("Try it");
    expect(screen.getByTestId("drawer-state").textContent).toBe("Drawer: closed");
    press(live.getByRole("button", { name: "Open navigation" }));
    const dialog = within(screen.getByRole("dialog", { name: "Navigation menu" }));
    expect(dialog.getByRole("navigation", { name: "Live navigation" })).toBeTruthy();
    expect(dialog.queryByRole("button", { name: "Collapse sidebar" })).toBeNull();
    expect(screen.getByTestId("drawer-state").textContent).toBe("Drawer: open");
  });

  it("closes the drawer on choosing an entry", () => {
    renderPage();
    press(section("Try it").getByRole("button", { name: "Open navigation" }));
    press(within(screen.getByRole("dialog")).getByRole("link", { name: "Customers" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("drawer-state").textContent).toBe("Drawer: closed");
  });

  it("closes the drawer from its Close button", () => {
    renderPage();
    press(section("Try it").getByRole("button", { name: "Open navigation" }));
    press(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("drawer-state").textContent).toBe("Drawer: closed");
  });
});

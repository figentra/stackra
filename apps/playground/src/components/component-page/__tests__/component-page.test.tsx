/**
 * Stackra file contract:
 * Purpose: proves the component page of `free/button` titles the document, draws the section anchors in the spec's
 *          order, the import line, the usage and example headings, the HeroUI docs link from the registry, the API
 *          table once the ApiDoc loads, under the anchor the shell's TOC rail links to.
 * Boundary: jsdom inside the DesignSystemProvider and a memory router; the lazy demos and ApiDoc resolve through
 *           Vite's globs.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (WP5 acceptance); ADR 0022.
 */
import { bySlug } from "@stackra/showcase";
import { DesignSystemProvider } from "@stackra/ui/react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { ComponentPage } from "#src/components/component-page";
import { PlaygroundIcons } from "#src/components/playground-icons";

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/button?scheme=dark"]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <PlaygroundIcons>
          <ComponentPage tier="free" slug="button" />
        </PlaygroundIcons>
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

describe("ComponentPage", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // The example tabs measure their scroll shadow.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
  });
  afterEach(async () => {
    // The page preloads every demo and API doc as it opens; each test waits for those imports to land, so none is
    // still loading when the environment is torn down (an EnvironmentTeardownError on a slow runner).
    await vi.dynamicImportSettled();
    vi.unstubAllGlobals();
  });

  it("draws the header, the sections in order and the registry links", async () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Button" })).toBeTruthy();
    expect(document.title).toBe("Button · Stackra Design System");
    expect(screen.getByRole("heading", { level: 3, name: "Usage" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "States" })).toBeTruthy();
    const docs = screen.getByRole("link", { name: /HeroUI docs/ });
    expect(docs.getAttribute("href")).toBe(bySlug("free", "button")?.hero.react?.docsUrl);
    expect(screen.getByRole("navigation", { name: "More in this category" })).toBeTruthy();
    // The doc-page hero, guidance and keyboard map come from the catalogue (STA-1371).
    expect(screen.getByText("Every action starts with one clear press.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Suggest an improvement/ }).getAttribute("href"),
    ).toContain("issues/new");
    expect(screen.getByRole("heading", { level: 3, name: "When not to use it" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Keyboard" })).toBeTruthy();
    // The ApiDoc loads lazily: one table per part, named "<Part> Props".
    const table = await screen.findByRole("grid", { name: "Button Props" });
    expect(within(table).getByText("variant")).toBeTruthy();
    expect(document.getElementById("api-Button")).toBeTruthy();
    // The playground mounts once the ApiDoc is in, so the order is read after it.
    const ids = [...document.querySelectorAll("section[id], header[id], div[id]")].map(
      (el) => el.id,
    );
    const order = [
      "header",
      "links",
      "import",
      "usage",
      "guidance",
      "examples",
      "playground",
      "accessibility",
      "rtl",
      "stackra",
      "related",
      "pager",
    ];
    const seen = ids.filter((id) => order.includes(id));
    expect(seen).toEqual(order);
  });
});

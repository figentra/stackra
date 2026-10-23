/**
 * Stackra file contract:
 * Purpose: proves the link page titles the document, shows one link per tone with both underlines, underlined links in running text, external links that open a new tab, an internal link that keeps the URL's search, the disabled, press-only and icon-only states, and a link inside Arabic text.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and a memory router; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-028
import { Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { Link } from "#src/routes/link/link";
import { LinkRoute } from "#src/routes/link/link.route";

function renderPage(url = "/link?scheme=dark&locale=ar") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <DesignSystemProvider colorScheme="light" locale="en">
        <Link />
      </DesignSystemProvider>
    </MemoryRouter>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Link page", () => {
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

  it("titles the page and the document, and sits at /link under Navigation", () => {
    renderPage();
    expect(LinkRoute.path).toBe("/link");
    expect(LinkRoute.category).toBe("Navigation");
    expect(screen.getByRole("heading", { level: 1, name: "Link" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Link · Stackra Playground");
  });

  it("shows one link per tone with the underline on hover and always", () => {
    renderPage();
    const tones = section("Tones");
    for (const tone of Tone) {
      const links = tones.getAllByRole("link", { name: tone });
      expect(links, tone).toHaveLength(2);
      expect(links[0]?.classList.contains("underline")).toBe(false);
      expect(links[1]?.classList.contains("underline")).toBe(true);
    }
  });

  it("underlines every link inside running text", () => {
    renderPage();
    const links = section("In running text").getAllByRole("link");
    expect(links).toHaveLength(Tone.length);
    for (const link of links) expect(link.classList.contains("underline")).toBe(true);
  });

  it("opens external links in a new tab and names the icon-only one by its label", () => {
    renderPage();
    const external = section("External");
    const text = external.getByRole("link", { name: "HeroUI documentation opens in a new tab" });
    expect(text.getAttribute("target")).toBe("_blank");
    expect(text.getAttribute("rel")).toBe("noopener noreferrer");
    expect(
      external.getByRole("link", { name: "HeroUI website (opens in a new tab)" }),
    ).toBeTruthy();
  });

  it("keeps the scheme and language in the internal link", () => {
    renderPage();
    expect(
      section("Router").getByRole("link", { name: "Go to Foundations" }).getAttribute("href"),
    ).toBe("/foundations?scheme=dark&locale=ar");
  });

  it("shows a disabled, a press-only and an icon-only link, and counts presses", () => {
    renderPage();
    const states = section("States");
    expect(states.getByRole("link", { name: "Disabled link" }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(states.getByRole("link", { name: "Settings" }).getAttribute("href")).toContain(
      "#link-states",
    );
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 0 times.");
    act(() => states.getByRole("link", { name: "Press only" }).click());
    expect(screen.getByTestId("press-count").textContent).toBe("Pressed 1 time.");
  });

  it("draws the link inside Arabic text in a right-to-left paragraph", () => {
    renderPage();
    const link = section("Long text").getByRole("link");
    expect(link.closest("p")?.getAttribute("dir")).toBe("rtl");
    expect(link.closest("p")?.getAttribute("lang")).toBe("ar");
  });
});

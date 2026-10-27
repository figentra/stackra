/**
 * Stackra file contract:
 * Purpose: proves the typography page titles the document, shows one sample per Text type, Heading type and tone,
 *          headings at levels 2 to 6 with one level 1, Arabic samples that carry their own language and direction,
 *          and a live sample that answers a press.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-021 sta-350:P-015
import { HeadingType, TextAlign, TextTone, TextType } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Typography } from "#src/routes/typography/typography";
import { TypographyRoute } from "#src/routes/typography/typography.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light">
      <Typography />
    </DesignSystemProvider>,
  );
}

describe("Typography page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // React Aria warns when a heading's element differs from its style's own; the page shows exactly that.
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("titles the page and the document, with exactly one level-1 heading, and sits at /typography", () => {
    renderPage();
    expect(routePath(TypographyRoute)).toBe("/typography");
    expect(TypographyRoute.category).toBe("Foundations");
    expect(screen.getByRole("heading", { level: 1, name: "Typography" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Typography · Stackra Playground");
  });

  it("shows one Latin and one Arabic sample per Text type, in HeroUI's class for it", () => {
    renderPage();
    for (const [type, heroui] of [
      ["body", "body"],
      ["small", "body-sm"],
      ["caption", "body-xs"],
    ] as const) {
      expect(TextType).toContain(type);
      expect(screen.getByTestId(`text-${type}`).classList.contains(`typography--${heroui}`)).toBe(
        true,
      );
      expect(screen.getByTestId(`text-${type}-ar`).getAttribute("lang")).toBe("ar");
    }
  });

  it("shows every Heading type as a level-3 heading, in Latin and in Arabic", () => {
    renderPage();
    for (const type of HeadingType) {
      const heading = screen.getByTestId(`heading-${type}`);
      expect(heading.localName).toBe("h3");
      expect(heading.classList.contains(`typography--${type}`)).toBe(true);
      expect(screen.getByTestId(`heading-${type}-ar`).getAttribute("dir")).toBe("rtl");
    }
  });

  it("shows headings at levels 3 to 6 under the level-2 sections, and no level jumps", () => {
    renderPage();
    const levels = within(screen.getByRole("region", { name: "Heading levels" }));
    for (const level of [3, 4, 5, 6])
      expect(levels.getByRole("heading", { level }).textContent).toBe(`Level ${level}`);
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(5);
  });

  it("marks the Arabic sample with its language and direction", () => {
    renderPage();
    const arabic = screen.getByTestId("lang-ar");
    expect(arabic.getAttribute("lang")).toBe("ar");
    expect(arabic.getAttribute("dir")).toBe("rtl");
    expect(screen.getByTestId("lang-en").getAttribute("dir")).toBe("ltr");
  });

  it("shows every tone twice, on the page and on a surface, and every alignment", () => {
    renderPage();
    for (const tone of TextTone) {
      expect(screen.getByTestId(`tone-${tone}`)).toBeTruthy();
      expect(screen.getByTestId(`tone-${tone}-surface`)).toBeTruthy();
    }
    for (const align of TextAlign)
      expect(
        screen.getByTestId(`align-${align}`).classList.contains(`typography--align-${align}`),
      ).toBe(true);
  });

  it("truncates one sample and not its twin, and restates the bold weight", () => {
    renderPage();
    expect(screen.getByTestId("truncated").classList.contains("typography--truncate")).toBe(true);
    expect(screen.getByTestId("wrapped").classList.contains("typography--truncate")).toBe(false);
    expect(screen.getByTestId("weight-bold").classList.contains("typography--weight-bold")).toBe(
      true,
    );
  });

  it("changes the live tone and says so when the button is pressed", () => {
    renderPage();
    const live = within(screen.getByRole("region", { name: "Try it" }));
    expect(live.getByRole("status").textContent).toBe("Tone default, pressed 0 times.");
    act(() => live.getByRole("button", { name: "Next tone" }).click());
    expect(live.getByRole("status").textContent).toBe("Tone muted, pressed 1 time.");
    expect(live.getByTestId("live-text").classList.contains("typography--color-muted")).toBe(true);
  });
});

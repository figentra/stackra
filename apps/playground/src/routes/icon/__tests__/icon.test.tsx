/**
 * Stackra file contract:
 * Purpose: proves the icon page titles the document and renders each section with the sizes, tones, names and
 *          mirroring the Icon contract promises, and that its live sample answers a press.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-052 sta-350:FR-016 sta-350:P-015
import { TextTone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Icon } from "#src/routes/icon/icon";
import { IconRoute } from "#src/routes/icon/icon.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage(locale = "en") {
  render(
    <DesignSystemProvider colorScheme="light" locale={locale}>
      <PlaygroundIcons>
        <Icon />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

/** The labelled samples of the page, in page order. */
const LABELLED = [
  ...TextTone,
  "Rated",
  "Next",
  "Continue",
  "Send",
  "Undo",
  "Search",
  "Done",
  "Play",
];

describe("Icon page", () => {
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

  it("titles the page and the document, and sits at /icon", () => {
    renderPage();
    expect(routePath(IconRoute)).toBe("/icon");
    expect(IconRoute.category).toBe("Foundations");
    expect(screen.getByRole("heading", { level: 1, name: "Icon" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Icon · Stackra Playground");
  });

  it("shows three sizes, 16, 20 and 24 pixels", () => {
    renderPage();
    const sizes = [...screen.getByRole("region", { name: "Sizes" }).querySelectorAll("svg")];
    expect(sizes.map((svg) => svg.getAttribute("width"))).toEqual(["16", "20", "24"]);
  });

  it("shows one labelled sample per tone, in the tone's colour role, and one that inherits", () => {
    renderPage();
    const tones = section("Tones");
    for (const tone of TextTone)
      expect(tones.getByRole("img", { name: tone }).style.color).toBe(
        `var(--${tone === "default" ? "foreground" : tone})`,
      );
    const inheriting = [
      ...screen.getByRole("region", { name: "Tones" }).querySelectorAll("svg"),
    ].filter((svg) => svg.getAttribute("aria-hidden") === "true");
    expect(inheriting).toHaveLength(1);
    expect(inheriting[0]?.style.color).toBe("");
  });

  it("exposes exactly the labelled samples as images, and hides the decorative ones", () => {
    renderPage();
    expect(screen.getAllByRole("img").map((image) => image.getAttribute("aria-label"))).toEqual(
      LABELLED,
    );
  });

  it("mirrors the directional samples in Arabic and no other", () => {
    renderPage("ar");
    for (const name of ["Next", "Continue", "Send", "Undo"])
      expect(screen.getByRole("img", { name }).style.transform, name).toBe("scaleX(-1)");
    for (const name of ["Search", "Done", "Play"])
      expect(screen.getByRole("img", { name }).style.transform, name).toBe("");
  });

  it("mirrors nothing in English", () => {
    renderPage("en");
    for (const name of ["Next", "Continue", "Send", "Undo"])
      expect(screen.getByRole("img", { name }).style.transform, name).toBe("");
  });

  it("draws an alias and an app's own namespaced icon at the three sizes, and passes className through", () => {
    renderPage();
    const components = [
      ...screen
        .getByRole("region", { name: "Names, aliases and custom icons" })
        .querySelectorAll("svg"),
    ];
    expect(components[0]?.classList.contains("lucide-shopping-cart")).toBe(true);
    expect(components.slice(1, 4).map((svg) => svg.getAttribute("width"))).toEqual([
      "16",
      "20",
      "24",
    ]);
    expect(screen.getByTestId("passed-class").classList.contains("opacity-50")).toBe(true);
  });

  it("changes the live icon and says so when a button is pressed", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("status").textContent).toBe("Size md, tone default, pressed 0 times.");
    act(() => live.getByRole("button", { name: "Next size" }).click());
    act(() => live.getByRole("button", { name: "Next tone" }).click());
    expect(live.getByRole("status").textContent).toBe("Size lg, tone muted, pressed 2 times.");
    expect(screen.getByTestId("live-icon").getAttribute("width")).toBe("24");
    expect(screen.getByTestId("live-icon").style.color).toBe("var(--muted)");
  });
});

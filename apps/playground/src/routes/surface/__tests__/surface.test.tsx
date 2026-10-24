/**
 * Stackra file contract:
 * Purpose: proves the surface page titles the document, shows one surface per level, nests three, shows text on each level, and repaints the live surface at the level the buttons pick.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-032 sta-350:P-030
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Surface } from "#src/routes/surface/surface";
import { SurfaceRoute } from "#src/routes/surface/surface.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Surface />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

/** The surface of the live sample. */
const liveSurface = () => screen.getByTestId("live-surface");

describe("Surface page", () => {
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

  it("titles the page and the document, and sits at /surface under Surfaces", () => {
    renderPage();
    expect(SurfaceRoute.path).toBe("/surface");
    expect(SurfaceRoute.category).toBe("Layout");
    expect(screen.getByRole("heading", { level: 1, name: "Surface" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Surface · Stackra Playground");
  });

  it("shows one surface per level, in the levels section", () => {
    renderPage();
    const roots = section("Levels").getAllByText(/^Level /, { selector: "p, span, div" });
    expect(roots).toHaveLength(4);
    const classes = [
      ...document.querySelectorAll('#surface-levels ~ div [data-slot="surface"]'),
    ].map((node) => [...node.classList].find((name) => name.startsWith("surface--")));
    expect(classes).toEqual([
      "surface--default",
      "surface--secondary",
      "surface--tertiary",
      "surface--transparent",
    ]);
  });

  it("nests default, secondary and tertiary surfaces", () => {
    renderPage();
    const nested = section("Nested");
    const surfaces = [
      ...(nested
        .getByText("Level default")
        .closest('[data-slot="surface"]')
        ?.querySelectorAll('[data-slot="surface"]') ?? []),
    ];
    expect(
      surfaces.map((node) => [...node.classList].find((name) => name.startsWith("surface--"))),
    ).toEqual(["surface--secondary", "surface--tertiary"]);
  });

  it("shows default and muted text on every non-transparent level", () => {
    renderPage();
    const text = section("Text on each level");
    expect(text.getAllByText("Default text")).toHaveLength(3);
    expect(text.getAllByText("Muted text")).toHaveLength(3);
  });

  it("repaints the live surface at the level the buttons pick", () => {
    renderPage();
    const live = section("Try it");
    expect(liveSurface().classList.contains("surface--secondary")).toBe(true);
    act(() => live.getByRole("button", { name: "Use tertiary" }).click());
    expect(liveSurface().classList.contains("surface--tertiary")).toBe(true);
    expect(live.getByRole("button", { name: "Use tertiary" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(live.getByRole("button", { name: "Use secondary" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(live.getByText("This surface is tertiary.")).toBeTruthy();
  });
});

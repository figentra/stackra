/**
 * Stackra file contract:
 * Purpose: proves the avatar page titles the document, shows one avatar per size and shape and per tone and variant,
 *          the fallbacks, the one-letter Arabic name, a named standalone avatar beside a silent list row, and steps
 *          the live avatar through names and the image.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; jsdom loads no images, so the image
 *          samples show their fallback and the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-046 sta-350:P-035
import { AvatarShape, AvatarVariant, Size, Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { Avatar } from "#src/routes/avatar/avatar";
import { AvatarRoute } from "#src/routes/avatar/avatar.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <Avatar />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Avatar page", () => {
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

  it("titles the page and the document, and sits at /avatar under Status", () => {
    renderPage();
    expect(AvatarRoute.path).toBe("/avatar");
    expect(AvatarRoute.category).toBe("Status");
    expect(screen.getByRole("heading", { level: 1, name: "Avatar" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Avatar · Stackra Playground");
  });

  it("shows an image and an initials avatar per size, in each shape", () => {
    renderPage();
    for (const shape of AvatarShape) {
      const samples = [...document.querySelectorAll(`#avatar-sizes ~ div [data-shape="${shape}"]`)];
      expect(samples).toHaveLength(Size.length * 2);
      expect(samples.filter((sample) => sample.classList.contains("rounded-lg"))).toHaveLength(
        shape === "square" ? Size.length * 2 : 0,
      );
    }
  });

  it("shows the initials of every tone in every variant", () => {
    renderPage();
    for (const variant of AvatarVariant) {
      const samples = [...document.querySelectorAll(`[data-variant="${variant}"]`)];
      expect(samples.map((sample) => sample.getAttribute("data-tone"))).toEqual([...Tone]);
      for (const sample of samples) expect(sample.textContent).toBe("AL");
    }
  });

  it("shows the fallbacks: initials for the broken image, an icon for the organisation and the person", () => {
    renderPage();
    const fallbacks = section("Fallbacks");
    expect(fallbacks.getAllByText(/./).length).toBeGreaterThan(0);
    expect(document.querySelector('[data-sample="broken"]')?.textContent).toBe("AL");
    expect(document.querySelectorAll('[data-sample="organisation"] svg')).toHaveLength(1);
    expect(document.querySelectorAll('[data-sample="anonymous"] svg')).toHaveLength(1);
  });

  it("gives an Arabic name one letter", () => {
    renderPage();
    const letters = [...document.querySelectorAll('[data-sample="name"]')].map(
      (sample) => sample.textContent,
    );
    expect(letters).toEqual(["AL", "P", "ÉZ", "ل"]);
  });

  it("names the standalone avatar and leaves the list row's one silent", () => {
    renderPage();
    const name = section("Accessible name");
    expect(name.getByRole("img", { name: "Ada Lovelace, administrator" })).toBeTruthy();
    expect(name.getAllByRole("img")).toHaveLength(1);
    expect(within(name.getByRole("listitem")).queryByRole("img")).toBeNull();
  });

  it("steps the live avatar through the names and the image", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("img", { name: "Current avatar" }).textContent).toBe("AL");
    act(() => live.getByRole("button", { name: "Next name" }).click());
    expect(live.getByRole("img", { name: "Current avatar" }).textContent).toBe("P");
    act(() => live.getByRole("button", { name: "Show image" }).click());
    expect(live.getByRole("button", { name: "Hide image" })).toBeTruthy();
  });
});

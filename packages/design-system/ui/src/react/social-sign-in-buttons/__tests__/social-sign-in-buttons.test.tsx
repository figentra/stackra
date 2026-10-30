/**
 * Stackra file contract:
 * Purpose: proves the web SocialSignInButtons draws each known provider's built-in mark (by `provider` or by `id`),
 *          lets a custom `icon` win, and falls back to the initial for an unknown provider.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { SocialSignInButtons } from "#react/social-sign-in-buttons/social-sign-in-buttons";

describe("SocialSignInButtons (web)", () => {
  it("draws the built-in mark of every known provider", () => {
    const ids = ["apple", "google", "microsoft", "x", "facebook", "email"];
    const { container } = render(
      <SocialSignInButtons providers={ids.map((id) => ({ id, name: id }))} />,
    );
    for (const id of ids) {
      const mark = container.querySelector(`svg[data-mark="${id}"]`);
      expect(mark).not.toBeNull();
      expect(mark?.getAttribute("aria-hidden")).toBe("true");
      expect(mark?.querySelectorAll("path").length).toBeGreaterThan(0);
    }
    // Google's G is four colours; Apple's logo takes the text colour.
    expect(container.querySelectorAll('svg[data-mark="google"] path')).toHaveLength(4);
    expect(container.querySelector('svg[data-mark="apple"] path')?.getAttribute("fill")).toBe(
      "currentColor",
    );
  });

  it("takes the mark from `provider` when the id is the app's own", () => {
    const { container } = render(
      <SocialSignInButtons
        providers={[{ id: "ms-work", name: "Microsoft", provider: "microsoft" }]}
      />,
    );
    expect(container.querySelector('svg[data-mark="microsoft"]')).not.toBeNull();
  });

  it("lets a custom icon win and gives an unknown provider its initial", () => {
    const { container } = render(
      <SocialSignInButtons
        providers={[
          { id: "apple", name: "Apple", icon: <i data-testid="own" /> },
          { id: "github", name: "GitHub" },
        ]}
      />,
    );
    expect(screen.getByTestId("own")).toBeTruthy();
    expect(container.querySelector("svg[data-mark]")).toBeNull();
    expect(container.querySelector('[data-glyph="G"]')).not.toBeNull();
  });
});

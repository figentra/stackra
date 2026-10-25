/**
 * Stackra file contract:
 * Purpose: proves the web EnvironmentBanner draws nothing in production, and elsewhere a warning alert announced at
 *          once that names the environment, with its description and actions, and offers no way to dismiss it.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so roles, text and classes are read, not looks.
 * Runtime: browser
 * Governing contract: ADR 0280 (decision 5 and open detail 4); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { EnvironmentBanner } from "#react/environment-banner/environment-banner";

describe("EnvironmentBanner (web)", () => {
  it("draws nothing in production", () => {
    const { container } = render(<EnvironmentBanner environment="Production" isProduction />);
    expect(container.innerHTML).toBe("");
  });

  it("names a non-production environment as a warning, with its detail and actions", () => {
    render(
      <EnvironmentBanner
        environment="Sandbox"
        isProduction={false}
        description="Payments are in test mode."
        actions={<button type="button">Publish to live</button>}
      />,
    );
    const banner = screen.getByRole("alert");
    expect(banner.classList.contains("alert--warning")).toBe(true);
    expect(banner.textContent).toContain("Sandbox");
    expect(banner.textContent).toContain("Payments are in test mode.");
    expect(screen.getByRole("button", { name: "Publish to live" })).toBeTruthy();
  });

  it("offers no dismiss control", () => {
    render(<EnvironmentBanner environment="Staging" isProduction={false} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

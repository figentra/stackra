/**
 * Stackra file contract:
 * Purpose: proves the Environment banner page sits at /environment-banner, titles the page and the document, names
 *          the sandbox with its meaning and action, and draws nothing once switched to production.
 * Boundary: jsdom with the real `@stackra/ui` web entry.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-803.
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { EnvironmentBanner } from "#src/routes/environment-banner/environment-banner";
import { EnvironmentBannerRoute } from "#src/routes/environment-banner/environment-banner.route";

describe("EnvironmentBanner page", () => {
  it("sits at /environment-banner, and titles the page and the document", () => {
    render(<EnvironmentBanner />);
    expect(EnvironmentBannerRoute.path).toBe("/environment-banner");
    expect(
      screen.getByRole("heading", { level: 1, name: EnvironmentBannerRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("Environment banner · Stackra Playground");
  });

  it("names the sandbox, and draws nothing in production", () => {
    render(<EnvironmentBanner />);
    expect(
      screen.getByText("Payments are test payments and messages are captured, not sent."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish to live" })).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Show as production" }));
    expect(screen.queryByRole("button", { name: "Publish to live" })).toBeNull();
  });
});

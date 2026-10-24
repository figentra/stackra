/**
 * Stackra file contract:
 * Purpose: proves the alert page titles the document, shows one alert per tone announced by its tone, the parts one at
 *          a time (title only, actions, an icon of its own, none), and a live sample that inserts a failure as an
 *          alert and a confirmation as a status and removes them again.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @covers sta-350:FR-116
import { Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { Alert } from "#src/routes/alert/alert";
import { AlertRoute } from "#src/routes/alert/alert.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Alert />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Alert page", () => {
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

  it("titles the page and the document, and sits at /alert under Feedback and status", () => {
    renderPage();
    expect(AlertRoute.path).toBe("/alert");
    expect(AlertRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: "Alert" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Alert · Stackra Playground");
  });

  it("shows one alert per tone, announced by its tone", () => {
    renderPage();
    const tones = section("Tones");
    expect(document.querySelectorAll('#alert-tones ~ ul [data-slot="alert-root"]')).toHaveLength(
      Tone.length,
    );
    expect(tones.getAllByRole("alert")).toHaveLength(2);
    expect(tones.getAllByRole("status")).toHaveLength(3);
    for (const title of ["Storage is almost full", "Payment failed"]) {
      const alert = tones.getByText(title).closest('[role="alert"]');
      expect(alert?.getAttribute("aria-live")).toBe("assertive");
    }
  });

  it("shows the parts: title only, actions, an icon of its own and none", () => {
    renderPage();
    const parts = section("Parts");
    const roots = [
      ...document.querySelectorAll<HTMLElement>('#alert-parts ~ ul [data-slot="alert-root"]'),
    ];
    expect(roots).toHaveLength(4);
    const [titleOnly, withActions, ownIcon, noIcon] = roots;
    expect(titleOnly?.querySelector('[data-slot="alert-description"]')).toBeNull();
    expect(within(withActions as HTMLElement).getAllByRole("button")).toHaveLength(2);
    expect(parts.getByRole("button", { name: "Upgrade plan" })).toBeTruthy();
    expect(ownIcon?.querySelector("svg.lucide-circle-check")).toBeTruthy();
    expect(noIcon?.querySelector('[data-slot="alert-indicator"]')).toBeNull();
  });

  it("inserts a failure as an alert and a confirmation as a status, and removes them", async () => {
    renderPage();
    const live = section("Try it");
    expect(live.queryByRole("alert")).toBeNull();
    act(() => live.getByRole("button", { name: "Show payment error" }).click());
    expect(live.getByRole("alert").textContent).toContain("Payment failed");
    act(() => live.getByRole("button", { name: "Try again" }).click());
    expect(live.queryByRole("alert")).toBeNull();
    expect(live.getByRole("status").textContent).toContain("Changes saved");
    act(() => live.getByRole("button", { name: "Dismiss" }).click());
    expect(live.queryByRole("status")).toBeNull();
  });
});

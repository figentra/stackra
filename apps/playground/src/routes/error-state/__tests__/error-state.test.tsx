/**
 * Stackra file contract:
 * Purpose: proves the error state page titles the document, shows one state per kind with its own heading and the
 *          sign-in, back and retry buttons that fit it, the four parts (details, a retry with a further action, an
 *          icon of its own, none), and a live sample that fails, loads for a moment and recovers, then breaks again.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia and fake timers for the simulated retry;
 *           the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0313 (decisions 1 and 6); WCAG 2.2 SC 1.3.1 and 4.1.3; ADR 0022
 *          (test placement).
 */
// @covers sta-350:FR-151
import { ErrorKind } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, render, screen, within } from "@testing-library/react";

import { ErrorState } from "#src/routes/error-state/error-state";
import { ErrorStateRoute } from "#src/routes/error-state/error-state.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <ErrorState />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Error state page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /error-state under Feedback", () => {
    renderPage();
    expect(ErrorStateRoute.path).toBe("/error-state");
    expect(ErrorStateRoute.category).toBe("Feedback");
    expect(screen.getByRole("heading", { level: 1, name: "Error state" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Error state · Stackra Playground");
  });

  it("shows one state per kind, announced at once, each with its own heading and way forward", () => {
    renderPage();
    const kinds = section("Kinds");
    expect(document.querySelectorAll("#error-state-kinds ~ ul [data-kind]")).toHaveLength(
      ErrorKind.length,
    );
    expect(kinds.getAllByRole("alert")).toHaveLength(ErrorKind.length);
    for (const name of [
      "Sign in to continue",
      "You do not have access",
      "We could not find that page",
      "Something went wrong",
    ])
      expect(kinds.getByRole("heading", { level: 3, name })).toBeTruthy();
    for (const name of ["Sign in", "Go back", "Try again"])
      expect(kinds.getAllByRole("button", { name }).length).toBeGreaterThan(0);
  });

  it("shows the parts: details, a retry and an action, an icon of its own and none", () => {
    renderPage();
    const parts = section("Parts");
    const states = [
      ...document.querySelectorAll<HTMLElement>("#error-state-parts ~ ul [data-kind]"),
    ];
    expect(states).toHaveLength(4);
    const [details, retry, ownIcon, noIcon] = states;
    expect(details?.querySelector('[data-slot="error-state-details"]')?.textContent).toContain(
      "The order service did not answer in time",
    );
    expect(
      within(retry as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Try again", "Contact support"]);
    expect(parts.getByRole("heading", { level: 3, name: "This page is locked" })).toBeTruthy();
    expect(ownIcon?.querySelector("svg")).toBeTruthy();
    expect(noIcon?.querySelector('[data-slot="state-icon"]')).toBeNull();
  });

  it("fails, loads for a moment, recovers and breaks again", () => {
    renderPage();
    const live = section("Try it");
    expect(live.getByRole("alert").textContent).toContain("Something went wrong");

    act(() => live.getByRole("button", { name: "Try again" }).click());
    expect(live.queryByRole("alert")).toBeNull();
    expect(live.getByRole("status").textContent).toBe("Loading orders");

    act(() => vi.advanceTimersByTime(600));
    expect(live.getByRole("heading", { level: 3, name: "Orders loaded" })).toBeTruthy();

    act(() => live.getByRole("button", { name: "Break it again" }).click());
    expect(live.getByRole("alert").textContent).toContain("Something went wrong");
  });
});

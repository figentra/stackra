/**
 * Stackra file contract:
 * Purpose: proves the web ErrorState announces itself at once (an alert, assertive, never a role from the caller),
 *          titles itself with a level-1 heading by default, draws the icon of its kind, shows the error's message outside
 *          production (in production only when `isMessageShown`) and, outside production only, its stack, offers a retry button that runs what it was given, puts further
 *          actions after it, passes unknown props through, and that the type requires a title and refuses `role` and
 *          `variant`.
 * Boundary: jsdom with real HeroUI and the real icon registry; the theme CSS is not loaded, so classes and attributes
 *           are read, not looks. `NODE_ENV` is stubbed for the production case.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); ADR 0140; WCAG 2.2 SC 1.3.1 and 4.1.3;
 *          ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-149
import { act, render, screen } from "@testing-library/react";

import type { ErrorStateContractProps } from "#contracts/types/error-state-contract-props.type";
import { ErrorState, type ErrorStateProps } from "#react/error-state/error-state";

/** The Lucide icon an element draws, by its kebab-case name. */
const drawsIcon = (container: HTMLElement, name: string) =>
  [...(container.querySelector("svg")?.classList ?? [])].some((className) =>
    className.startsWith(`lucide-${name}`),
  );

describe("ErrorState (web)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is an assertive alert, and the caller cannot change that", () => {
    const { container } = render(<ErrorState title="Something went wrong" />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("role")).toBe("alert");
    expect(root?.getAttribute("aria-live")).toBe("assertive");
  });

  it("titles the page with a level-1 heading, or the level given", () => {
    const { rerender } = render(<ErrorState title="Something went wrong" />);
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeTruthy();
    rerender(<ErrorState title="Something went wrong" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Something went wrong" })).toBeTruthy();
  });

  it.each([
    ["unauthenticated", "log-in"],
    ["forbidden", "ban"],
    ["not-found", "file-question"],
    ["unexpected", "triangle-alert"],
  ] as const)("draws the %s icon, decorative, and names the kind", (kind, icon) => {
    const { container } = render(<ErrorState kind={kind} title="Failed" />);
    expect(drawsIcon(container, icon)).toBe(true);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.getAttribute("data-kind")).toBe(kind);
  });

  it("is an unexpected failure without a kind", () => {
    const { container } = render(<ErrorState title="Failed" />);
    expect(container.firstElementChild?.getAttribute("data-kind")).toBe("unexpected");
  });

  it("shows the message of the error, and the stack outside production", () => {
    const error = new Error("Order service is down");
    const { container } = render(<ErrorState title="Failed" error={error} />);
    const details = container.querySelector('[data-slot="error-state-details"]');
    expect(details?.textContent).toContain("Order service is down");
    const stack = details?.querySelector("pre");
    expect(stack?.textContent).toBe(error.stack);
    expect(stack?.getAttribute("dir")).toBe("ltr");
  });

  it("hides the message in production, where it may be an internal", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(
      <ErrorState title="Failed" error={new Error("db: pool exhausted")} />,
    );
    expect(container.querySelector('[data-slot="error-state-details"]')).toBeNull();
  });

  it("shows the message in production when the app marks it as safe, never the stack", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(
      <ErrorState title="Failed" error={new Error("Order is not payable")} isMessageShown />,
    );
    const details = container.querySelector('[data-slot="error-state-details"]');
    expect(details?.textContent).toBe("Order is not payable");
    expect(details?.querySelector("pre")).toBeNull();
  });

  it("hides the message outside production when the app says so", () => {
    const { container } = render(
      <ErrorState title="Failed" error={new Error("x")} isMessageShown={false} />,
    );
    expect(container.querySelector('[data-slot="error-state-details"]')).toBeNull();
  });

  it("shows no details for a value with no message", () => {
    const { container } = render(<ErrorState title="Failed" error={{ code: 500 }} />);
    expect(container.querySelector('[data-slot="error-state-details"]')).toBeNull();
  });

  it("offers a retry that runs what it was given, with further actions after it", () => {
    const onPress = vi.fn();
    const { container } = render(
      <ErrorState
        title="Failed"
        retry={{ label: "Try again", onPress }}
        actions={<button type="button">Contact support</button>}
      />,
    );
    const actions = container.querySelector('[data-slot="state-actions"]');
    expect([...(actions?.querySelectorAll("button") ?? [])].map((b) => b.textContent)).toEqual([
      "Try again",
      "Contact support",
    ]);
    act(() => screen.getByRole("button", { name: "Try again" }).click());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no actions row without a retry or actions", () => {
    const { container } = render(<ErrorState title="Failed" />);
    expect(container.querySelector('[data-slot="state-actions"]')).toBeNull();
  });

  it("draws another icon, an element as given, and none for false", () => {
    const { container, rerender } = render(<ErrorState title="Failed" icon="info" />);
    expect(drawsIcon(container, "info")).toBe(true);
    rerender(<ErrorState title="Failed" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    rerender(<ErrorState title="Failed" icon={false} />);
    expect(container.querySelector('[data-slot="state-icon"]')).toBeNull();
  });

  it("passes unknown props through to the root", () => {
    const { container } = render(
      <ErrorState title="Failed" id="e" className="extra" data-testid="error" />,
    );
    const root = container.firstElementChild;
    expect(root?.id).toBe("e");
    expect(root?.classList.contains("extra")).toBe(true);
    expect(root?.getAttribute("data-testid")).toBe("error");
  });

  it("types: extends the contract, requires a title, refuses `role` and `variant`", () => {
    expectTypeOf<ErrorStateProps>().toExtend<ErrorStateContractProps>();
    // @ts-expect-error the title is the heading a screen reader jumps to
    void (<ErrorState />);
    // @ts-expect-error the page is a live region of its own, never the caller's
    void (<ErrorState title="Failed" role="status" />);
    // @ts-expect-error `variant` means emphasis, and an error state has one look
    void (<ErrorState title="Failed" variant="secondary" />);
    // @ts-expect-error a retry needs its label
    void (<ErrorState title="Failed" retry={{ onPress: () => undefined }} />);
  });
});

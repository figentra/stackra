/**
 * Stackra file contract:
 * Purpose: proves the toast page titles the document, has a button for every tone that shows a toast announced by its
 *          tone, shows a description and an action that runs and closes, moves the toasts to the top with the switch,
 *          dismisses them all, and clears the queue when the page unmounts.
 * Boundary: jsdom inside the DesignSystemProvider with stand-ins for matchMedia and ResizeObserver, which jsdom lacks
 *           and the toast stack reads; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0312 (decisions 2 and 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test
 *          placement).
 */
// @covers sta-350:FR-116
import { Tone } from "@stackra/ui/contracts";
import { DesignSystemProvider, toast } from "@stackra/ui/react";
import { act, render, screen, waitFor, within } from "@testing-library/react";

import { Toast } from "#src/routes/toast/toast";
import { ToastRoute } from "#src/routes/toast/toast.route";

/** Watches nothing: jsdom has no layout, and the toast stack only needs the observer to exist. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

function renderPage() {
  return render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Toast />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

/** The text part of the toast that shows `message`, whose live-region attributes say how it is announced. */
const contentOf = (message: string) =>
  screen.getByText(message).closest('[data-slot="toast-content"]');

describe("Toast page", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(async () => {
    act(() => toast.clear());
    // A cleared toast leaves on its exit; the queue is global, so a test waits for that before the next one starts.
    await waitFor(() => expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(0));
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /toast under Feedback", () => {
    renderPage();
    expect(ToastRoute.path).toBe("/toast");
    expect(ToastRoute.category).toBe("Feedback");
    expect(screen.getByRole("heading", { level: 1, name: "Toast" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Toast · Stackra Playground");
  });

  it("shows nothing until a toast is called", () => {
    renderPage();
    expect(document.querySelector('[data-slot="toast-region"]')).toBeNull();
  });

  it.each(Tone)("shows a %s toast announced by its tone", (tone) => {
    renderPage();
    act(() =>
      section("Tones")
        .getByRole("button", { name: `Show ${tone} toast` })
        .click(),
    );
    const message = {
      default: "Draft autosaved",
      accent: "A new version is available",
      success: "Changes saved",
      warning: "Storage is almost full",
      danger: "Payment failed",
    }[tone];
    const isUrgent = tone === "warning" || tone === "danger";
    expect(contentOf(message)?.getAttribute("role")).toBe(isUrgent ? "alert" : "status");
    expect(contentOf(message)?.getAttribute("aria-live")).toBe(isUrgent ? "assertive" : "polite");
  });

  it("shows a description with the message", () => {
    renderPage();
    act(() => section("Options").getByRole("button", { name: "With a description" }).click());
    expect(screen.getByText("Your profile is up to date.")).toBeTruthy();
  });

  it("runs the action and closes the toast", async () => {
    renderPage();
    act(() => section("Options").getByRole("button", { name: "With an action" }).click());
    expect(screen.getByText("Order deleted")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Undo" }).click());
    expect(screen.getByText("Order restored")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Order deleted")).toBeNull());
  });

  it("draws no indicator when the icon is false", () => {
    renderPage();
    act(() => section("Options").getByRole("button", { name: "No icon" }).click());
    expect(document.querySelector('[data-slot="toast-indicator"]')).toBeNull();
    act(() => toast.clear());
  });

  it("moves the toasts to the top with the switch", () => {
    renderPage();
    act(() =>
      section("Position and control")
        .getByRole("switch", { name: "Show toasts at the top" })
        .click(),
    );
    act(() => section("Tones").getByRole("button", { name: "Show success toast" }).click());
    expect(
      document.querySelector('[data-slot="toast-region"]')?.classList.contains("toast-region--top"),
    ).toBe(true);
  });

  it("stacks three toasts and dismisses them all", async () => {
    renderPage();
    const control = section("Position and control");
    act(() => control.getByRole("button", { name: "Show three toasts" }).click());
    expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(3);
    act(() => control.getByRole("button", { name: "Dismiss all toasts" }).click());
    await waitFor(() => expect(document.querySelectorAll('[data-slot="toast"]')).toHaveLength(0));
  });

  it("clears the queue when the page unmounts", async () => {
    const { unmount } = renderPage();
    act(() => section("Options").getByRole("button", { name: "Stays until dismissed" }).click());
    expect(screen.getByText("Upload paused")).toBeTruthy();
    unmount();
    renderPage();
    await waitFor(() => expect(screen.queryByText("Upload paused")).toBeNull());
  });
});

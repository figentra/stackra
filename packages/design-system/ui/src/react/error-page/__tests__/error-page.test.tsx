/**
 * Stackra file contract:
 * Purpose: proves the web ErrorPage draws each preset's title and description from the catalogue and its kind's or
 *          its own icon, lets the caller's words and icon win, keeps ErrorState's alert, and runs a retry that stays
 *          pending until its promise settles, refusing a second press meanwhile.
 * Boundary: jsdom with real HeroUI; `useUiText` echoes the key, so the test does not depend on the catalogue's English.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); GAPS.md row 31; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ErrorPagePreset } from "#contracts/enums/error-page-preset.enum";
import { ErrorPage } from "#react/error-page/error-page";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string) => key,
}));

describe("ErrorPage (web)", () => {
  it.each(ErrorPagePreset)("draws the %s preset's words, an icon and the alert", (preset) => {
    const group = preset.replace("-", "_");
    const { container } = render(<ErrorPage preset={preset} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      `ui::error_page.${group}.title`,
    );
    expect(screen.getByText(`ui::error_page.${group}.description`)).toBeTruthy();
    expect(screen.getByRole("alert").getAttribute("data-preset")).toBe(preset);
    expect(container.querySelector("[data-slot='state-icon'] svg")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("lets the caller's words and icon win", () => {
    render(
      <ErrorPage
        preset="not-found"
        title="Order #1042 is gone"
        description={null}
        icon={<b data-testid="mine" />}
      />,
    );
    expect(screen.getByRole("heading").textContent).toBe("Order #1042 is gone");
    expect(screen.queryByText(/description/)).toBeNull();
    expect(screen.getByTestId("mine")).toBeTruthy();
  });

  it("keeps the retry pending until its promise settles and refuses a second press", async () => {
    let settle: (() => void) | undefined;
    const onRetry = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    render(<ErrorPage preset="offline" onRetry={onRetry} actions={<a href="/">Home</a>} />);
    const retry = screen.getByRole("button", { name: "ui::error_page.retry" });
    fireEvent.click(retry);
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(retry.getAttribute("data-pending")).toBe("true"));
    await act(async () => {
      settle?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(retry.getAttribute("data-pending")).toBeNull());
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
  });

  it("names the retry with the caller's label", () => {
    render(<ErrorPage preset="server-error" onRetry={() => undefined} retryLabel="Reload" />);
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });
});

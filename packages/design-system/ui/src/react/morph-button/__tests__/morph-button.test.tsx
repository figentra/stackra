/**
 * Stackra file contract:
 * Purpose: proves the web MorphButton is one button through every state: named by the state's words, round and busy
 *          while loading, refusing presses while loading and on success, settling from success back to its label after
 *          `successDuration`, and announcing each state's words in a polite live region.
 * Boundary: jsdom with real HeroUI and React Aria; fake timers for the success delay.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329; WCAG 2.2 SC 4.1.3; ADR 0022.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MorphButton } from "#react/morph-button/morph-button";

const LABELS = { idle: "Pay", loading: "Paying", success: "Paid", error: "Try again" } as const;

describe("MorphButton (web)", () => {
  it("is one button that takes each state's words and shape", () => {
    const onPress = vi.fn();
    const { rerender, container } = render(<MorphButton labels={LABELS} onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Pay" });
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<MorphButton labels={LABELS} state="loading" onPress={onPress} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(button.getAttribute("data-state")).toBe("loading");
    expect(button.getAttribute("data-pending")).toBe("true");
    expect(button.className).toContain("px-0");
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("Paying");

    rerender(<MorphButton labels={LABELS} state="error" onPress={onPress} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBe(button);
    expect(button.className).toContain("--danger");
    fireEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("Try again");
  });

  it("shows the success check, then settles back to its label", () => {
    vi.useFakeTimers();
    const onSuccessEnd = vi.fn();
    render(
      <MorphButton
        labels={LABELS}
        state="success"
        successDuration={1000}
        onSuccessEnd={onSuccessEnd}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.getAttribute("data-state")).toBe("success");
    expect(button.className).toContain("--success");
    act(() => vi.advanceTimersByTime(1000));
    expect(onSuccessEnd).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("data-state")).toBe("idle");
    expect(button.textContent).toContain("Pay");
    vi.useRealTimers();
  });
});

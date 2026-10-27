/**
 * Stackra file contract:
 * Purpose: proves the native KdsBoard ages each ticket in the tone of the caller's steps, shows its flags and lines,
 *          bumps a ticket and a line, recalls, and shows the all-day counts of the lines still to make.
 * Boundary: React Native does not render in vitest: react-native (View, Pressable) and `@stackra/ui/native` are
 *           replaced by recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { KdsBoard } from "#native/kds-board/kds-board";

vi.mock("react-native", () => ({
  View: ({ children, testID }: { children?: ReactNode; testID?: string }) => (
    <div data-testid={testID}>{children}</div>
  ),
  Pressable: ({
    children,
    testID,
    accessibilityState,
    onPress,
  }: {
    children?: ReactNode;
    testID?: string;
    accessibilityState?: { checked?: boolean };
    onPress?: () => void;
  }) => (
    <button
      type="button"
      data-testid={testID}
      aria-pressed={accessibilityState?.checked}
      onClick={onPress}
    >
      {children}
    </button>
  ),
}));
vi.mock("@stackra/ui/native", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Chip: ({ children, tone }: { children?: ReactNode; tone?: string }) => (
    <span data-tone={tone}>{children}</span>
  ),
  Button: ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  ),
}));

const now = 500 * 60_000;
const props = {
  label: "Expo",
  now,
  ageTones: [{ fromMinutes: 5, tone: "warning" as const }],
  formatAge: (minutes: number) => `${minutes} min`,
  tickets: [
    {
      id: "k1",
      title: "Table 3",
      sentAt: now - 6 * 60_000,
      hasAllergy: true,
      items: [
        { id: "a", quantity: 1, name: "Soup", isDone: true },
        { id: "b", quantity: 2, name: "Salad" },
      ],
    },
  ],
};

describe("KdsBoard (native)", () => {
  it("ages a ticket, shows its flags and lines, and bumps", () => {
    const onBump = vi.fn();
    const onItemBump = vi.fn();
    const onRecall = vi.fn();
    render(<KdsBoard {...props} onBump={onBump} onItemBump={onItemBump} onRecall={onRecall} />);
    expect(screen.getByText("6 min").getAttribute("data-tone")).toBe("warning");
    expect(screen.getByText("Allergy").getAttribute("data-tone")).toBe("warning");
    expect(screen.getByTestId("ticket-item-a").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByTestId("ticket-item-b"));
    expect(onItemBump).toHaveBeenCalledWith("k1", "b");
    fireEvent.click(screen.getByRole("button", { name: "Bump" }));
    expect(onBump).toHaveBeenCalledWith("k1");
    fireEvent.click(screen.getByRole("button", { name: "Recall" }));
    expect(onRecall).toHaveBeenCalledOnce();
  });

  it("shows the all-day counts of the lines still to make", () => {
    render(<KdsBoard {...props} showAllDay />);
    expect(screen.getByTestId("kds-all-day").textContent).toBe("2 × Salad");
  });
});

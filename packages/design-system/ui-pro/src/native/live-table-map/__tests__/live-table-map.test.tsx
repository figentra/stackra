/**
 * Stackra file contract:
 * Purpose: proves the native LiveTableMap names each table with its status, lines and suggestion, hides a wall from
 *          screen readers, shows a label, and reports a pressed table.
 * Boundary: React Native does not render in vitest: react-native (View, Pressable) and `@stackra/ui/native` are
 *           replaced by recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { LiveTableMap } from "#native/live-table-map/live-table-map";

vi.mock("react-native", () => ({
  View: ({
    children,
    importantForAccessibility,
  }: {
    children?: ReactNode;
    importantForAccessibility?: string;
  }) => <div data-hidden={importantForAccessibility}>{children}</div>,
  Pressable: ({
    children,
    accessibilityLabel,
    disabled,
    onPress,
  }: {
    children?: ReactNode;
    accessibilityLabel: string;
    disabled?: boolean;
    onPress?: () => void;
  }) => (
    <button type="button" aria-label={accessibilityLabel} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  ),
}));
vi.mock("@stackra/ui/native", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Chip: ({ children, tone }: { children?: ReactNode; tone: string }) => (
    <span data-tone={tone}>{children}</span>
  ),
}));

const items = [
  { id: "t1", shape: "rectangle" as const, label: "T1", x: 0, y: 0, width: 2, height: 2 },
  { id: "w", shape: "wall" as const, label: "", x: 0, y: 4, width: 6, height: 1 },
  { id: "door", shape: "label" as const, label: "Door", x: 4, y: 0, width: 2, height: 1 },
];

describe("LiveTableMap (native)", () => {
  it("names each table with its live state, reports a press and hides walls", () => {
    const onTablePress = vi.fn();
    const { container } = render(
      <LiveTableMap
        label="Main hall"
        columns={6}
        rows={5}
        items={items}
        tables={[
          { id: "t1", statusLabel: "Paid", tone: "success", lines: ["Sara"], isSuggested: true },
        ]}
        onTablePress={onTablePress}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "T1, Paid, Sara, Suggested" }));
    expect(onTablePress).toHaveBeenCalledWith("t1");
    expect(screen.getByText("Paid").getAttribute("data-tone")).toBe("success");
    expect(screen.getByText("Door")).toBeTruthy();
    expect(container.querySelector("[data-hidden='no-hide-descendants']")).toBeTruthy();
  });
});

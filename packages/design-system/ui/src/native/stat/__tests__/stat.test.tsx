/**
 * Stackra file contract:
 * Purpose: proves the native `Stat` shows its label before the figure, formats a number in the provider's locale,
 *          shows a string as given, draws the badge only when it has one, and adds the trend, target and drill-down.
 * Boundary: React Native does not render in vitest, so react-native, the native Text and Chip are replaced by plain
 *           DOM stand-ins; the order and text of what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { Stat } from "#native/stat/stat";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});

// The KPI extras draw through Skia and Reanimated, which do not load in vitest; stand-ins record what they get.
vi.mock("#native/sparkline/sparkline", () => ({ Sparkline: () => null }));
vi.mock("#native/kpi/trend-chip", async () => {
  const { createElement } = await import("react");
  return {
    TrendChip: (props: Record<string, unknown>) => createElement("i", null, String(props["value"])),
  };
});
vi.mock("#native/progress-bar/progress-bar", async () => {
  const { createElement } = await import("react");
  return {
    ProgressBar: (props: Record<string, unknown>) =>
      createElement("progress", null, props["label"] as ReactNode),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement("em", null, props["children"] as ReactNode),
  };
});

describe("Stat (native)", () => {
  it("shows the label before the figure, formatted in the provider's locale", () => {
    const { container } = render(
      <DesignSystemContext value={{ locale: "de-DE", resolvedMotion: "none" } as DesignSystemState}>
        <Stat label="Points" value={12_500} badge="Gold" />
      </DesignSystemContext>,
    );
    expect(container.textContent).toBe("Points12.500Gold");
  });

  it("shows text as given and draws no empty badge", () => {
    const { container } = render(<Stat label="Redeemed" value="−40" badge={undefined} />);
    expect(container.textContent).toBe("Redeemed−40");
    expect(container.querySelector("em")).toBeNull();
  });

  it("adds the trend, the target and a drill-down button", async () => {
    const { fireEvent, screen } = await import("@testing-library/react");
    const onPress = vi.fn();
    render(<Stat label="Revenue" value={800} trend={0.1} target={1000} onPress={onPress} />);
    expect(screen.getByText("0.1")).toBeTruthy();
    expect(screen.getByText("Target 1,000")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open Revenue" }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("works the trend out from the previous period and writes it under the figure", async () => {
    const { screen } = await import("@testing-library/react");
    render(<Stat label="Revenue" value={1200} previousValue={1000} />);
    expect(screen.getByText("0.2")).toBeTruthy();
    expect(screen.getByText("Previous period: 1,000")).toBeTruthy();
  });
});

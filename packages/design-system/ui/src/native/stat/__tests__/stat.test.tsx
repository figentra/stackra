/**
 * Stackra file contract:
 * Purpose: proves the native `Stat` shows its label before the figure, formats a number in the provider's locale,
 *          shows a string as given, and draws the badge only when it has one.
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
      <DesignSystemContext value={{ locale: "de-DE" } as DesignSystemState}>
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
});

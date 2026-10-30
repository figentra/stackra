/**
 * Stackra file contract:
 * Purpose: proves the native `TextReveal` draws one entering word per piece inside one header labelled with the whole
 *          text, keeps a mixed-direction text whole, and is a plain heading at the `none` level.
 * Boundary: React Native and Reanimated do not run in vitest: View, Animated.View and Text are plain DOM stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { TextReveal } from "#native/text-reveal/text-reveal";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { role: props["accessibilityRole"], "aria-label": props["accessibilityLabel"] },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const entrance = { delay: () => entrance, duration: () => entrance };
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement(
          "i",
          { "data-entering": String(Boolean(props["entering"])) },
          props["children"] as ReactNode,
        ),
    },
    FadeInDown: entrance,
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { role: props["accessibilityRole"] }, props["children"] as ReactNode),
  };
});

const at = (resolvedMotion: DesignSystemState["resolvedMotion"]) =>
  ({ resolvedMotion }) as DesignSystemState;

describe("TextReveal (native)", () => {
  it("enters word by word inside one labelled header", () => {
    const { container, getByRole } = render(
      <DesignSystemContext value={at("full")}>
        <TextReveal>بنية واحدة لكل شاشة</TextReveal>
      </DesignSystemContext>,
    );
    expect(getByRole("header").getAttribute("aria-label")).toBe("بنية واحدة لكل شاشة");
    expect(container.querySelectorAll('[data-entering="true"]')).toHaveLength(4);
  });

  it("keeps a mixed-direction text whole and is plain at none", () => {
    const mixed = render(
      <DesignSystemContext value={at("full")}>
        <TextReveal>نظام Stackra الموحّد</TextReveal>
      </DesignSystemContext>,
    );
    expect(mixed.container.querySelectorAll("i")).toHaveLength(1);
    const plain = render(
      <DesignSystemContext value={at("none")}>
        <TextReveal>Plain</TextReveal>
      </DesignSystemContext>,
    );
    expect(plain.container.querySelector("i")).toBeNull();
    expect(plain.container.textContent).toBe("Plain");
  });
});

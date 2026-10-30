/**
 * Stackra file contract:
 * Purpose: proves the native DateLabel hands the Chip the state's tone and the short text (the state's word joined
 *          to it), names itself with the full date, takes the locale, pulses once only when overdue or expired and
 *          animated and motion is not reduced, draws nothing for an invalid date, and refuses `children`, `tone` and
 *          the accessible name.
 * Boundary: Reanimated, the Chip and the provider are replaced by recording stand-ins; `useUiText` writes the key and
 *           its values.
 * Runtime: node
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { DateLabel } from "#native/date-label/date-label";

const state = vi.hoisted(() => ({
  chip: {} as Record<string, unknown>,
  sequences: 0,
  isReduced: false,
  locale: "en",
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as never),
    },
    ReduceMotion: { System: "system" },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.isReduced,
    useSharedValue: (value: number) => ({ get: () => value, set: () => undefined }),
    withSequence: (...steps: unknown[]) => {
      state.sequences += 1;
      return steps.at(-1);
    },
    withTiming: (value: number) => value,
  };
});

vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) => {
      state.chip = props;
      return createElement("span", null, props["children"] as never);
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: state.locale }),
}));

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}(${Object.values(values).join("|")})` : key,
}));

const NOW = new Date(2026, 9, 28, 12);

describe("DateLabel (native)", () => {
  beforeEach(() => {
    state.sequences = 0;
    state.isReduced = false;
    state.locale = "en";
  });

  it("hands the Chip the tone and the text, and names itself with the full date", () => {
    render(<DateLabel kind="due" date={new Date(2026, 9, 29)} now={NOW} />);
    const text = "ui::date_label.with_state(ui::date_label.due_soon|tomorrow)";
    expect(state.chip).toMatchObject({
      tone: "warning",
      variant: "soft",
      size: "sm",
      children: text,
      accessible: true,
      accessibilityLabel: `ui::date_label.with_date(${text}|Thursday, October 29, 2026)`,
    });
  });

  it("takes the provider's locale", () => {
    state.locale = "ar";
    render(<DateLabel date={new Date(2026, 9, 29)} now={NOW} />);
    expect(state.chip["children"]).toBe("غدًا");
  });

  it("pulses once when overdue or expired, never otherwise, reduced or with animation off", () => {
    render(<DateLabel kind="expiry" date={new Date(2026, 9, 1)} now={NOW} />);
    expect(state.sequences).toBe(1);
    render(<DateLabel kind="due" date={new Date(2026, 9, 29)} now={NOW} />);
    render(<DateLabel kind="due" date={new Date(2026, 9, 1)} now={NOW} isAnimated={false} />);
    state.isReduced = true;
    render(<DateLabel kind="due" date={new Date(2026, 9, 1)} now={NOW} />);
    expect(state.sequences).toBe(1);
  });

  it("draws nothing for an invalid date", () => {
    const { container } = render(<DateLabel date="soon" now={NOW} />);
    expect(container.innerHTML).toBe("");
  });

  it("types: refuses `children`, `tone` and the accessible name", () => {
    // @ts-expect-error the label builds the children
    render(<DateLabel date={NOW}>x</DateLabel>);
    // @ts-expect-error the state picks the tone
    render(<DateLabel date={NOW} tone="success" />);
    // @ts-expect-error the label names itself
    render(<DateLabel date={NOW} accessibilityLabel="x" />);
  });
});

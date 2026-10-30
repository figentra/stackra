/**
 * Stackra file contract:
 * Purpose: proves the native PromptSuggestions draws one named button per suggestion that reports it, refuses while
 *          disabled, wraps by default and scrolls sideways in the scroll layout.
 * Boundary: React Native, Surface, Text and SlotIcon are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { PromptSuggestions } from "#native/prompt-suggestions/prompt-suggestions";

const state = vi.hoisted(() => ({
  pressables: [] as Record<string, unknown>[],
  scrolls: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return {
    View: box,
    ScrollView: (props: Record<string, unknown>) => {
      state.scrolls.push(props);
      return box(props);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.pressables.push(props);
      return box(props);
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});
vi.mock("#native/slot-icon/slot-icon", () => ({ SlotIcon: () => null }));
vi.mock("#native/surface/surface", async () => {
  const { createElement } = await import("react");
  return {
    Surface: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as never),
  };
});

const SUGGESTIONS = [
  {
    id: "track",
    title: "Track my order",
    description: "See where order 2048 is now",
    icon: "truck" as const,
  },
  { id: "return", title: "Start a return" },
];

describe("PromptSuggestions (native)", () => {
  beforeEach(() => {
    state.pressables = [];
    state.scrolls = [];
  });

  it("draws one named button per suggestion that reports it", () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);
    expect(state.scrolls).toHaveLength(0);
    expect(state.pressables.map((props) => props["accessibilityLabel"])).toEqual([
      "Track my order, See where order 2048 is now",
      "Start a return",
    ]);
    (state.pressables[1]?.["onPress"] as () => void)?.();
    expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1]);
  });

  it("refuses while disabled and scrolls sideways in the scroll layout", () => {
    render(
      <PromptSuggestions
        suggestions={SUGGESTIONS}
        onSelect={() => undefined}
        isDisabled
        layout="scroll"
      />,
    );
    expect(state.scrolls[0]).toMatchObject({
      horizontal: true,
      accessibilityLabel: "Suggested prompts",
    });
    expect(state.pressables[0]).toMatchObject({
      disabled: true,
      accessibilityState: { disabled: true },
    });
  });
});

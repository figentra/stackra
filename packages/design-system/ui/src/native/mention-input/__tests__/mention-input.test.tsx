/**
 * Stackra file contract:
 * Purpose: proves the native MentionInput lists the people matching the query after `@` under a named group, writes
 *          `@Name ` when one is pressed with a selection haptic, and reports the mentioned ids.
 * Boundary: jsdom with React Native and the house parts replaced by stand-ins.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { MentionInput } from "#native/mention-input/mention-input";

const state = vi.hoisted(() => ({
  played: [] as string[],
  area: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        {
          role: props["accessibilityRole"] as string | undefined,
          "aria-label": props["accessibilityLabel"] as string | undefined,
        },
        props["children"] as ReactNode,
      ),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text-area/text-area", () => ({
  TextArea: (props: Record<string, unknown>) => {
    state.area = props;
    return null;
  },
}));
vi.mock("#native/avatar/avatar", () => ({ Avatar: () => null }));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const PEOPLE = [
  { id: "sara", name: "Sara Al-Harbi" },
  { id: "noura", name: "Noura Faisal" },
] as const;

describe("MentionInput (native)", () => {
  it("lists matching people after @ and writes the chosen name", () => {
    const onChange = vi.fn();
    const onMentionsChange = vi.fn();
    render(
      <MentionInput
        label="Note"
        people={PEOPLE}
        onChange={onChange}
        onMentionsChange={onMentionsChange}
      />,
    );
    act(() => (state.area["onChange"] as (text: string) => void)("Ask @no"));
    expect(screen.getByRole("list", { name: "People to mention" })).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Noura Faisal" }).click());
    expect(onChange).toHaveBeenLastCalledWith("Ask @Noura Faisal ");
    expect(onMentionsChange).toHaveBeenLastCalledWith(["noura"]);
    expect(state.played).toEqual(["selection"]);
    expect(state.area["selection"]).toEqual({ start: 18, end: 18 });
  });
});

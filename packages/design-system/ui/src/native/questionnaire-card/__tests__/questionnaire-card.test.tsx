/**
 * Stackra file contract:
 * Purpose: proves the native QuestionnaireCard hands each question to the right field with "Other" added, waits for a
 *          required answer, announces each step with its question, summarises the answers and sends them.
 * Boundary: React Native and the house children are recording stand-ins rendering plain DOM; what reaches them is
 *           checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { QuestionnaireQuestion } from "#contracts/types/questionnaire-question.type";
import { QuestionnaireCard } from "#native/questionnaire-card/questionnaire-card";

const state = vi.hoisted(() => ({
  announced: [] as string[],
  props: {} as Record<string, Record<string, unknown>>,
  buttons: [] as Record<string, unknown>[],
}));

/** A stand-in that records its props under `name` and draws its children. */
const { standIn } = vi.hoisted(() => ({
  standIn: async (name: string) => {
    const { createElement } = await import("react");
    return (props: Record<string, unknown>) => {
      state.props[name] = props;
      if (name === "button") state.buttons.push(props);
      return createElement("div", { "data-name": name }, props["children"] as ReactNode);
    };
  },
}));

vi.mock("react-native", async () => ({
  AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
  View: await standIn("view"),
}));
vi.mock("#native/ai-mark/ai-mark", async () => ({ AiMark: await standIn("ai-mark") }));
vi.mock("#native/button/button", async () => ({ Button: await standIn("button") }));
vi.mock("#native/card/card", async () => {
  const part = await standIn("card");
  return {
    Card: Object.assign(part, {
      Header: part,
      Title: part,
      Description: part,
      Content: part,
      Footer: part,
    }),
  };
});
vi.mock("#native/checkbox-group/checkbox-group", async () => ({
  CheckboxGroup: await standIn("checkboxes"),
}));
vi.mock("#native/chip/chip", async () => ({ Chip: await standIn("chip") }));
vi.mock("#native/progress-bar/progress-bar", async () => ({
  ProgressBar: await standIn("progress"),
}));
vi.mock("#native/radio-group/radio-group", async () => ({ RadioGroup: await standIn("radios") }));
vi.mock("#native/text/text", async () => ({ Text: await standIn("text") }));
vi.mock("#native/text-area/text-area", async () => ({ TextArea: await standIn("text-area") }));
vi.mock("#native/text-field/text-field", async () => ({ TextField: await standIn("text-field") }));

const QUESTIONS: readonly QuestionnaireQuestion[] = [
  {
    id: "goal",
    title: "What is the offer for?",
    kind: "single",
    isRequired: true,
    allowsOther: true,
    options: [{ value: "clear", label: "Clear old stock" }],
  },
  { id: "notes", title: "Anything else?", kind: "text" },
];

/** The last button drawn with these words. */
const button = (words: string): Record<string, unknown> => {
  for (let index = state.buttons.length - 1; index >= 0; index -= 1) {
    const props = state.buttons[index];
    if (props?.["children"] === words) return props;
  }
  return {};
};
const tap = (words: string) => act(() => (button(words)["onPress"] as () => void)());

describe("QuestionnaireCard (native)", () => {
  beforeEach(() => {
    state.announced = [];
    state.props = {};
    state.buttons = [];
  });

  it("asks, announces, summarises and sends", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <QuestionnaireCard title="Offer" questions={QUESTIONS} onSubmit={onSubmit} />,
    );
    expect(state.props["progress"]).toMatchObject({
      value: 1,
      maxValue: 2,
      label: "Question 1 of 2",
    });
    const radios = state.props["radios"] ?? {};
    expect((radios["options"] as { label: string }[]).map((option) => option.label)).toEqual([
      "Clear old stock",
      "Other",
    ]);
    expect(button("Next")["isDisabled"]).toBe(true);
    act(() => (radios["onChange"] as (value: string) => void)("clear"));
    expect(button("Next")["isDisabled"]).toBe(false);
    tap("Next");
    expect(state.announced).toEqual(["Question 2 of 2: Anything else?"]);
    const type = (state.props["text-area"] ?? {})["onChange"] as (value: string) => void;
    act(() => type("Weekends only"));
    tap("Review answers");
    expect(state.announced.at(-1)).toBe("Your answers");
    expect(container.textContent).toContain("Clear old stock");
    expect(container.textContent).toContain("Weekends only");
    expect(button("Edit")["label"]).toBe("Edit the answer to: Anything else?");
    tap("Send answers");
    expect(onSubmit).toHaveBeenCalledWith({ goal: "clear", notes: "Weekends only" });
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the native PromptInput sends the trimmed text and clears, refuses empty text, locks while a reply
 *          runs and turns its button into Stop while streaming.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; IconButton is a recording stand-in.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { PromptInput } from "#native/prompt-input/prompt-input";

const state = vi.hoisted(() => ({ buttons: [] as Record<string, unknown>[] }));

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("#native/prompt-input/prompt-input-icons.constant", () => ({ PROMPT_INPUT_ICONS: {} }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

/** The last-drawn button. */
const button = () => state.buttons.at(-1) ?? {};

describe("PromptInput (native)", () => {
  it("sends the trimmed text, then clears", () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    expect(button()["isDisabled"]).toBe(true);
    fireEvent.change(screen.getByLabelText("Message input"), { target: { value: " Hi " } });
    expect(button()["label"]).toBe("Send message");
    act(() => (button()["onPress"] as () => void)());
    expect(onSubmit).toHaveBeenCalledWith("Hi");
    expect((screen.getByLabelText("Message input") as HTMLInputElement).value).toBe("");
  });

  it("offers Stop while streaming", () => {
    const onStop = vi.fn();
    render(<PromptInput onSubmit={() => {}} onStop={onStop} status="streaming" />);
    expect(button()["label"]).toBe("Stop generating");
    expect(button()["onPress"]).toBe(onStop);
  });
});

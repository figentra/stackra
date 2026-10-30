/**
 * Stackra file contract:
 * Purpose: proves the native VoiceInput records through the mock driver by default, marks its button `checked` and
 *          names it for the next press, draws five bars (or the level as a number under reduced motion) while
 *          listening, announces each state, and hands the recording to `onRecord`.
 * Boundary: React Native, reanimated, the icons and the house children are recording stand-ins rendering plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { VoiceInput } from "#native/voice-input/voice-input";

const state = vi.hoisted(() => ({
  reduced: false,
  announced: [] as string[],
  buttons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-view": "true" }, props["children"] as never),
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => state.reduced }));
vi.mock("@stackra/icons/native/lucide-icons", () => ({ Mic: () => null, Square: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => createElement("span", {}, props["children"] as never),
  };
});

/** The button's props as last drawn. */
const button = () => state.buttons.at(-1) ?? {};

/** Presses the button and lets the recorder's promises settle. */
const press = () =>
  act(async () => {
    (button()["onPress"] as () => void)();
  });

describe("VoiceInput (native)", () => {
  beforeEach(() => {
    state.announced = [];
    state.buttons = [];
    state.reduced = false;
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("records with the mock driver and hands the recording over", async () => {
    const onRecord = vi.fn();
    const { container, getByText } = render(<VoiceInput onRecord={onRecord} />);
    expect(button()).toMatchObject({
      label: "Start recording",
      accessibilityState: { checked: false },
    });
    await press();
    expect(button()).toMatchObject({
      label: "Stop recording",
      accessibilityState: { checked: true },
    });
    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelectorAll("[data-view] [data-view] [data-view]")).toHaveLength(5);
    expect(getByText("Listening…")).toBeTruthy();
    await press();
    expect(onRecord).toHaveBeenCalledWith(expect.objectContaining({ data: null }));
    // The mock answers at once, so "waiting" and "processing" pass within one render and are never drawn.
    expect(state.announced).toEqual(["Listening…"]);
    expect(button()["label"]).toBe("Start recording");
  });

  it("shows the level as a number under reduced motion", async () => {
    state.reduced = true;
    const { container } = render(<VoiceInput />);
    await press();
    act(() => vi.advanceTimersByTime(400));
    expect(container.textContent).toMatch(/\d+%/);
  });
});

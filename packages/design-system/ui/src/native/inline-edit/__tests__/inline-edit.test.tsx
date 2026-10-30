/**
 * Stackra file contract:
 * Purpose: proves the native InlineEdit names its value by the edit word and the label, opens an editor with the value
 *          on press, saves on the button and on the return key (reporting only a change, with a success haptic),
 *          cancels, keeps the editor open with the error `validate` gives and an error haptic, and refuses to open
 *          when read-only.
 * Boundary: React Native does not render in vitest, so React Native, Reanimated, the TextField, the IconButton, the Icon,
 *           the Text and the haptics are replaced by stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: gap inventory row 5; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { InlineEdit } from "#native/inline-edit/inline-edit";

const state = vi.hoisted(() => ({ play: vi.fn(), field: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    View: (props: { children?: ReactNode }) => h("div", null, props.children),
    Pressable: (props: Record<string, unknown>) =>
      h(
        "button",
        {
          "aria-label": props["accessibilityLabel"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement: h } = await import("react");
  const builder: Record<string, () => unknown> = {};
  for (const name of ["duration", "reduceMotion"]) builder[name] = () => builder;
  return {
    default: { View: (props: { children?: ReactNode }) => h("div", null, props.children) },
    FadeIn: builder,
    FadeOut: builder,
    ReduceMotion: { System: "system" },
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => false,
    useSharedValue: (value: number) => ({ value, set: () => undefined }),
    withSequence: (...steps: unknown[]) => steps,
    withTiming: (value: number) => value,
  };
});
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: state.play } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement: h } = await import("react");
  return { Text: (props: { children?: ReactNode }) => h("span", null, props.children) };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement: h } = await import("react");
  return {
    IconButton: (props: { readonly label: string; readonly onPress?: () => void }) =>
      h("button", { "aria-label": props.label, onClick: props.onPress }),
  };
});
vi.mock("#native/text-field/text-field", async () => {
  const { createElement: h } = await import("react");
  return {
    TextField: (props: Record<string, unknown>) => {
      state.field = props;
      return h("input", {
        "aria-label": props["accessibilityLabel"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (text: string) => void)(event.target.value),
      });
    },
  };
});

const WORDS = { editLabel: "Edit", saveLabel: "Save", cancelLabel: "Cancel" } as const;
const readValue = () => screen.getByRole("button", { name: "Edit, Table name" });
const editor = () => screen.getByRole("textbox", { name: "Table name" }) as HTMLInputElement;

describe("InlineEdit (native)", () => {
  beforeEach(() => state.play.mockClear());

  it("opens an editor with the value and saves on the button with a success haptic", () => {
    const onChange = vi.fn();
    render(<InlineEdit label="Table name" defaultValue="T1" onChange={onChange} {...WORDS} />);
    act(() => readValue().click());
    expect(editor().value).toBe("T1");
    fireEvent.change(editor(), { target: { value: "Terrace 1" } });
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(onChange).toHaveBeenCalledWith("Terrace 1");
    expect(state.play).toHaveBeenCalledWith("success");
    expect(readValue().textContent).toContain("Terrace 1");
  });

  it("saves on the return key, reporting only a change, and cancels", () => {
    const onChange = vi.fn();
    render(<InlineEdit label="Table name" defaultValue="T1" onChange={onChange} {...WORDS} />);
    act(() => readValue().click());
    act(() => (state.field["onSubmitEditing"] as () => void)());
    expect(onChange).not.toHaveBeenCalled();
    act(() => readValue().click());
    fireEvent.change(editor(), { target: { value: "X" } });
    act(() => screen.getByRole("button", { name: "Cancel" }).click());
    expect(readValue().textContent).toContain("T1");
  });

  it("keeps the editor open with the validation error and an error haptic", () => {
    render(
      <InlineEdit
        label="Table name"
        defaultValue="T1"
        validate={(draft) => (draft === "" ? "Required" : undefined)}
        {...WORDS}
      />,
    );
    act(() => readValue().click());
    fireEvent.change(editor(), { target: { value: "" } });
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(state.field["isInvalid"]).toBe(true);
    expect(state.field["errorMessage"]).toBe("Required");
    expect(state.play).toHaveBeenCalledWith("error");
  });

  it("refuses to open when read-only", () => {
    render(<InlineEdit label="Table name" defaultValue="T1" isReadOnly {...WORDS} />);
    act(() => readValue().click());
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

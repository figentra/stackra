/**
 * Stackra file contract:
 * Purpose: proves the native TagInput adds the tags in typed text once a comma arrives, on submit or on blur, hands
 *          them to the TagGroup with a remove action, removes the last on backspace in an empty draft, counts against
 *          the maximum and stops taking text when full, locks when read-only, and announces a refused duplicate.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; the TagGroup records its props.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { TagInput } from "#native/tag-input/tag-input";

const seen = vi.hoisted(() => ({
  items: [] as unknown[],
  group: {} as Record<string, unknown>,
  input: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { nativeDom } = await import("#testing/fakes/native-dom");
  const { domOf } = await import("#testing/fakes/dom-of.function");
  const Input = domOf("input");
  // The shared stand-in, with a TextInput that also records its props so submit, backspace and blur can be driven.
  return {
    ...nativeDom,
    TextInput: (props: Record<string, unknown>) => {
      seen.input = props;
      return <Input {...props} />;
    },
  };
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/tag-group/tag-group", () => ({
  TagGroup: (props: { items: unknown[] } & Record<string, unknown>) => {
    seen.items = props.items;
    seen.group = props;
    return null;
  },
}));

describe("TagInput (native)", () => {
  it("adds the tags once a comma arrives and announces a duplicate", () => {
    render(<TagInput label="Tags" defaultValue={["vip"]} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tags" }), {
      target: { value: "VIP, Riyadh," },
    });
    expect(seen.items).toEqual([
      { id: "0", label: "vip" },
      { id: "1", label: "Riyadh" },
    ]);
    expect(screen.getByText("“VIP” is already added.").getAttribute("aria-live")).toBe("polite");
  });

  it("adds on submit and blur, removes from the group and by backspace", () => {
    const onChange = vi.fn();
    render(
      <TagInput label="Tags" placeholder="Add" onChange={onChange} description="Comma to add" />,
    );
    expect(seen.input["placeholder"]).toBe("Add");
    expect(screen.getByText("Comma to add")).toBeTruthy();
    const input = () => seen.input;
    act(() => (input()["onChangeText"] as (text: string) => void)("red"));
    act(() => (input()["onSubmitEditing"] as () => void)());
    expect(onChange).toHaveBeenLastCalledWith(["red"]);
    expect(input()).not.toHaveProperty("placeholder");
    act(() => (input()["onChangeText"] as (text: string) => void)("blue"));
    act(() => (input()["onBlur"] as () => void)());
    expect(onChange).toHaveBeenLastCalledWith(["red", "blue"]);
    act(() => (input()["onBlur"] as () => void)());
    expect(onChange).toHaveBeenCalledTimes(2);
    expect((seen.group["removeLabel"] as (tag: string) => string)("red")).toBe("Remove red");
    act(() => (seen.group["onRemove"] as (keys: string[]) => void)(["0"]));
    expect(onChange).toHaveBeenLastCalledWith(["blue"]);
    act(() => (input()["onKeyPress"] as (e: unknown) => void)({ nativeEvent: { key: "a" } }));
    act(() =>
      (input()["onKeyPress"] as (e: unknown) => void)({ nativeEvent: { key: "Backspace" } }),
    );
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("counts against the maximum and stops taking text once full", () => {
    render(
      <TagInput label="Tags" maxTags={1} defaultValue={["a"]} isInvalid errorMessage="Too many" />,
    );
    expect(screen.getByText("1 of 1")).toBeTruthy();
    expect(seen.input["editable"]).toBe(false);
    expect(screen.getByText("Too many")).toBeTruthy();
  });

  it("locks while read-only, with no remove action and no name for a rich label", () => {
    render(<TagInput label={<b>R</b>} defaultValue={["a"]} isReadOnly isDisabled />);
    expect(seen.group).not.toHaveProperty("onRemove");
    expect(seen.group).not.toHaveProperty("accessibilityLabel");
    expect(seen.input["editable"]).toBe(false);
  });
});

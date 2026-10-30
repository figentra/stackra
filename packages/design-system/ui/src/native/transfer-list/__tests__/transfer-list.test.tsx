/**
 * Stackra file contract:
 * Purpose: proves the native TransferList stacks the available and chosen lists with counts, moves ticked items both
 *          ways and announces it, moves all the filter shows and filters each list.
 * Boundary: React Native, the Listbox, SearchField, Button, Text and the provider hooks are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { TransferList } from "#native/transfer-list/transfer-list";

const state = vi.hoisted(() => ({
  lists: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  searches: [] as Record<string, unknown>[],
  texts: [] as unknown[],
  announced: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
  };
});
vi.mock("#native/listbox/listbox", () => ({
  Listbox: (props: Record<string, unknown>) => {
    state.lists.push(props);
    return null;
  },
}));
vi.mock("#native/search-field/search-field", () => ({
  SearchField: (props: Record<string, unknown>) => {
    state.searches.push(props);
    return null;
  },
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));
vi.mock("#native/text/text", () => ({
  Text: (props: Record<string, unknown>) => {
    state.texts.push(props["children"]);
    return null;
  },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));
vi.mock("#native/hooks/use-number-format", () => ({
  useNumberFormat: () => (value: number) => String(value),
}));

const ITEMS = [
  { id: "riyadh", label: "Riyadh warehouse" },
  { id: "jeddah", label: "Jeddah warehouse" },
  { id: "dubai", label: "Dubai hub" },
];

/** The last-drawn list titled `name`. */
const list = (name: string) =>
  [...state.lists].reverse().find((props) => props["ariaLabel"] === name) ?? {};
const button = (label: string) =>
  [...state.buttons].reverse().find((props) => props["children"] === label) ?? {};
const call = (target: Record<string, unknown>, key: string, ...args: unknown[]) =>
  act(() => (target[key] as (...values: unknown[]) => void)(...args));

describe("TransferList (native)", () => {
  beforeEach(() => {
    state.lists = [];
    state.buttons = [];
    state.searches = [];
    state.texts = [];
    state.announced = [];
  });

  it("stacks the two lists with counts", () => {
    render(<TransferList items={ITEMS} defaultValue={["dubai"]} />);
    expect((list("Available")["items"] as unknown[]).length).toBe(2);
    expect((list("Chosen")["items"] as unknown[]).length).toBe(1);
    expect(state.texts).toContain("Chosen 1");
  });

  it("moves ticked items both ways and announces it", () => {
    const onChange = vi.fn();
    render(<TransferList items={ITEMS} onChange={onChange} />);
    expect(button("Add the ticked items")["isDisabled"]).toBe(true);
    call(list("Available"), "onChange", ["jeddah"]);
    call(button("Add the ticked items"), "onPress");
    expect(onChange).toHaveBeenLastCalledWith(["jeddah"]);
    expect(state.announced).toEqual(["1 item moved"]);
    call(list("Chosen"), "onChange", ["jeddah"]);
    call(button("Remove the ticked items"), "onPress");
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("filters a list and moves all it shows", () => {
    const onChange = vi.fn();
    render(<TransferList items={ITEMS} onChange={onChange} />);
    const search =
      [...state.searches]
        .reverse()
        .find((props) => props["accessibilityLabel"] === "Filter Available") ?? {};
    call(search, "onChange", "warehouse");
    expect((list("Available")["items"] as unknown[]).length).toBe(2);
    call(button("Add all"), "onPress");
    expect(onChange).toHaveBeenLastCalledWith(["riyadh", "jeddah"]);
  });
});

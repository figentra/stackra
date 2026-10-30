/**
 * Stackra file contract:
 * Purpose: proves the native TreeSelect's trigger opens a sheet holding the tree, closes it on a single choice and
 *          shows the chosen name, and counts the choices in multiple mode.
 * Boundary: jsdom with React Native, HeroUI Native and the house parts replaced by stand-ins; English catalogue words.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { TreeSelect } from "#native/tree-select/tree-select";

const state = vi.hoisted(() => ({ tree: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
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
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  return { TextField: pass, Label: pass, Description: pass, FieldError: pass };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const Drawer = Object.assign(
    (props: Record<string, unknown>) =>
      props["isOpen"]
        ? createElement("section", { role: "dialog" }, props["children"] as ReactNode)
        : null,
    { Header: pass, Title: pass, Body: pass, Close: () => null },
  );
  return { Drawer };
});
vi.mock("#native/tree-view/tree-view", () => ({
  TreeView: (props: Record<string, unknown>) => {
    state.tree = props;
    return null;
  },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));
vi.mock("#native/hooks/use-number-format", () => ({
  useNumberFormat: () => (value: number) => String(value),
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const ITEMS: readonly TreeViewNode[] = [
  { id: "riyadh", label: "Riyadh", children: [{ id: "olaya", label: "Olaya" }] },
  { id: "jeddah", label: "Jeddah" },
];

describe("TreeSelect (native)", () => {
  it("opens the sheet, closes it on a single choice and shows the name", () => {
    const onChange = vi.fn();
    render(<TreeSelect label="Branch" items={ITEMS} onChange={onChange} />);
    expect(screen.getByText("Choose")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Branch" }).click());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(state.tree["selectionMode"]).toBe("single");
    act(() => (state.tree["onSelectionChange"] as (keys: string[]) => void)(["olaya"]));
    expect(onChange).toHaveBeenLastCalledWith(["olaya"]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Olaya")).toBeTruthy();
  });

  it("counts the choices in multiple mode and stays open", () => {
    render(
      <TreeSelect
        label="Branches"
        items={ITEMS}
        selectionMode="multiple"
        defaultValue={["riyadh", "olaya", "jeddah"]}
      />,
    );
    expect(screen.getByText("3 chosen")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Branches" }).click());
    act(() => (state.tree["onSelectionChange"] as (keys: string[]) => void)(["jeddah"]));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(state.tree["isSelectionPropagated"]).toBe(true);
  });
});

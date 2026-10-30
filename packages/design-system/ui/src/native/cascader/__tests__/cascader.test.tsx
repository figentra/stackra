/**
 * Stackra file contract:
 * Purpose: proves the native Cascader shows the placeholder or the chosen path's names, drills down a level per row
 *          with rows under it, goes back with the back button, sets the path and closes on a leaf, and loads lazy rows.
 * Boundary: React Native, HeroUI Native, the Drawer, Icon, IconButton, Text and haptics are recording stand-ins that
 *           render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { Cascader } from "#native/cascader/cascader";

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
    {
      Header: pass,
      Title: (props: Record<string, unknown>) =>
        createElement("h2", null, props["children"] as ReactNode),
      Body: pass,
      Close: () => null,
    },
  );
  return { Drawer };
});
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      }),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

const ITEMS: readonly TreeViewNode[] = [
  {
    id: "sa",
    label: "Saudi Arabia",
    children: [{ id: "ruh", label: "Riyadh", children: [{ id: "olaya", label: "Al Olaya" }] }],
  },
  { id: "ae", label: "UAE", hasChildren: true },
];

const press = (name: string) => act(() => screen.getByRole("button", { name }).click());

describe("Cascader (native)", () => {
  it("drills down, goes back and sets the path on a leaf", () => {
    const onChange = vi.fn();
    render(<Cascader label="Delivery area" items={ITEMS} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Delivery area" }).textContent).toBe("Choose");
    press("Delivery area");
    press("Saudi Arabia");
    expect(screen.getByRole("heading").textContent).toBe("Saudi Arabia");
    press("Back");
    expect(screen.getByRole("heading").textContent).toBe("Delivery area");
    press("Saudi Arabia");
    press("Riyadh");
    press("Al Olaya");
    expect(onChange).toHaveBeenCalledWith(["sa", "ruh", "olaya"]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Delivery area" }).textContent).toBe(
      "Saudi Arabia/Riyadh/Al Olaya",
    );
  });

  it("loads lazy rows", async () => {
    let resolve: ((rows: readonly TreeViewNode[]) => void) | undefined;
    const onLoadChildren = vi.fn(
      () =>
        new Promise<readonly TreeViewNode[]>((done) => {
          resolve = done;
        }),
    );
    render(<Cascader label="Area" items={ITEMS} onLoadChildren={onLoadChildren} />);
    press("Area");
    press("UAE");
    expect(onLoadChildren).toHaveBeenCalledWith("ae");
    expect(screen.getByText("Loading…")).toBeTruthy();
    await act(async () => resolve?.([{ id: "dxb", label: "Dubai" }]));
    expect(screen.getByRole("button", { name: "Dubai" })).toBeTruthy();
  });
});

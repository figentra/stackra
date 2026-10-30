/**
 * Stackra file contract:
 * Purpose: proves the web Cascader shows the placeholder, opens one column per level of the browsed path, sets the
 *          path and closes on a leaf, shows the chosen path's names in its trigger, moves between columns with Right and
 *          Left, loads lazy rows with a loading status, and submits the path under `name`.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { Cascader } from "#react/cascader/cascader";

const ITEMS: readonly TreeViewNode[] = [
  {
    id: "sa",
    label: "Saudi Arabia",
    children: [
      {
        id: "ruh",
        label: "Riyadh",
        children: [
          { id: "olaya", label: "Al Olaya" },
          { id: "malqa", label: "Al Malqa" },
        ],
      },
      { id: "jed", label: "Jeddah", children: [{ id: "rawdah", label: "Al Rawdah" }] },
    ],
  },
  { id: "ae", label: "United Arab Emirates", hasChildren: true },
];

const option = (name: string) => screen.getByRole("option", { name });
const press = (element: HTMLElement) => act(() => element.click());

describe("Cascader (web)", () => {
  it("opens columns down the path and sets it on a leaf", () => {
    const onChange = vi.fn();
    render(<Cascader label="Delivery area" items={ITEMS} onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: /Delivery area/ });
    expect(trigger.textContent).toContain("Choose");
    press(trigger);
    expect(screen.getAllByRole("listbox")).toHaveLength(1);
    press(option("Saudi Arabia"));
    press(option("Riyadh"));
    expect(screen.getAllByRole("listbox")).toHaveLength(3);
    expect(screen.getByRole("listbox", { name: "Riyadh" })).toBeTruthy();
    press(option("Al Olaya"));
    expect(onChange).toHaveBeenCalledWith(["sa", "ruh", "olaya"]);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger.textContent).toBe("Saudi Arabia, /Riyadh, /Al Olaya");
  });

  it("moves between columns with Right and Left", async () => {
    render(<Cascader label="Delivery area" items={ITEMS} />);
    press(screen.getByRole("button", { name: /Delivery area/ }));
    act(() => option("Saudi Arabia").focus());
    act(() => void fireEvent.keyDown(option("Saudi Arabia"), { key: "ArrowRight" }));
    await vi.waitFor(() => expect(document.activeElement).toBe(option("Riyadh")));
    act(() => void fireEvent.keyDown(option("Riyadh"), { key: "ArrowLeft" }));
    await vi.waitFor(() => expect(document.activeElement).toBe(option("Saudi Arabia")));
  });

  it("loads lazy rows", async () => {
    let resolve: ((rows: readonly TreeViewNode[]) => void) | undefined;
    const onLoadChildren = vi.fn(
      () =>
        new Promise<readonly TreeViewNode[]>((done) => {
          resolve = done;
        }),
    );
    render(<Cascader label="Delivery area" items={ITEMS} onLoadChildren={onLoadChildren} />);
    press(screen.getByRole("button", { name: /Delivery area/ }));
    press(option("United Arab Emirates"));
    expect(onLoadChildren).toHaveBeenCalledWith("ae");
    expect(screen.getByRole("status").textContent).toBe("Loading…");
    await act(async () => resolve?.([{ id: "dxb", label: "Dubai" }]));
    expect(option("Dubai")).toBeTruthy();
  });

  it("submits the path under its name", () => {
    const { container } = render(
      <Cascader label="Area" items={ITEMS} defaultValue={["sa", "jed", "rawdah"]} name="area" />,
    );
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[name="area"]')];
    expect(inputs.map((input) => input.value)).toEqual(["sa", "jed", "rawdah"]);
  });
});

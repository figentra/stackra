/**
 * Stackra file contract:
 * Purpose: proves the web ListView names its list from `label`, maps `isVirtualized` to HeroUI Pro's `virtualized`,
 *          draws rows, reports selection and presses through React Aria's own handlers, passes unknown props
 *          through, carries HeroUI Pro's own parts, and refuses HeroUI Pro's names.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so roles and attributes are
 *          checked, not looks. Virtualisation measures a layout jsdom lacks, so only the flag HeroUI Pro writes on
 *          the list is checked, not the rows it would window.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { ListView as HeroListView } from "@heroui-pro/react/list-view";
import { render, screen } from "@testing-library/react";

import { ListView, type ListViewProps } from "#react/list-view/list-view";

const files = [
  { id: "a", name: "Proposal.pdf" },
  { id: "b", name: "Report.xlsx" },
];

function Files(props: Partial<ListViewProps<(typeof files)[number]>>) {
  return (
    <ListView label="Files" items={files} {...props}>
      {(file) => (
        <ListView.Item id={file.id} textValue={file.name}>
          <ListView.ItemContent>
            <ListView.Title>{file.name}</ListView.Title>
            <ListView.Description>{file.id}</ListView.Description>
          </ListView.ItemContent>
          <ListView.ItemAction>open</ListView.ItemAction>
        </ListView.Item>
      )}
    </ListView>
  );
}

describe("ListView (web)", () => {
  it("names the list from label and draws its rows", () => {
    render(<Files />);
    expect(screen.getByRole("grid", { name: "Files" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Proposal.pdf")).toBeTruthy();
  });

  it("maps isVirtualized to HeroUI Pro's virtualized, and leaves it off when not given", () => {
    const { rerender } = render(<Files isVirtualized data-testid="list" />);
    expect(screen.getByTestId("list").dataset["virtualized"]).toBe("true");
    rerender(<Files data-testid="list" />);
    expect(screen.getByTestId("list").dataset["virtualized"]).toBeUndefined();
  });

  it("reports selection and presses through React Aria's own handlers", () => {
    const onSelectionChange = vi.fn();
    const onPress = vi.fn();
    render(
      <ListView label="Files" selectionMode="single" onSelectionChange={onSelectionChange}>
        <ListView.Item id="a" textValue="Proposal.pdf" onPress={onPress}>
          Proposal.pdf
        </ListView.Item>
      </ListView>,
    );
    screen.getByRole("row", { name: "Proposal.pdf" }).click();
    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("passes unknown props through", () => {
    render(<Files data-testid="list" className="extra" />);
    expect(screen.getByTestId("list").classList.contains("extra")).toBe(true);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Item", "ItemContent", "Title", "Description", "ItemAction"] as const) {
      expect(ListView[part]).toBe(HeroListView[part]);
    }
  });

  it("takes the vocabulary names, and refuses HeroUI Pro's aria-label and virtualized", () => {
    expectTypeOf<ListViewProps<object>["label"]>().toEqualTypeOf<string>();
    expectTypeOf<ListViewProps<object>>().toHaveProperty("isVirtualized");
    expectTypeOf<ListViewProps<object>>().not.toHaveProperty("aria-label");
    expectTypeOf<ListViewProps<object>>().not.toHaveProperty("virtualized");
  });
});

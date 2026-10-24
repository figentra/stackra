/**
 * Stackra file contract:
 * Purpose: proves the native Table passes every prop of the root through unchanged, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/table subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  Table as HeroTable,
  useTable as heroUseTable,
  useTableColumn as heroUseTableColumn,
  useTableRow as heroUseTableRow,
  useTableState as heroUseTableState,
} from "heroui-native-pro/table";
import type { ReactNode } from "react";

import { Table, useTable, useTableColumn, useTableRow, useTableState } from "#native/table/table";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/table", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Table: Object.assign(root, {
      Background: part(),
      ScrollContainer: part(),
      Content: part(),
      Header: part(),
      Column: part(),
      Body: part(),
      Row: part(),
      Cell: part(),
      SelectAllCell: part(),
      SelectionCell: part(),
      Footer: part(),
    }),
    useTable: () => undefined,
    useTableColumn: () => undefined,
    useTableRow: () => undefined,
    useTableState: () => undefined,
  };
});

describe("Table (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("passes every prop through unchanged", () => {
    render(<Table variant="secondary" selectionMode="multiple" testID="found" />);
    expect(received.props).toMatchObject({
      variant: "secondary",
      selectionMode: "multiple",
      testID: "found",
    });
  });

  it.each([
    "Background",
    "ScrollContainer",
    "Content",
    "Header",
    "Column",
    "Body",
    "Row",
    "Cell",
    "SelectAllCell",
    "SelectionCell",
    "Footer",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Table[name]).toBe(HeroTable[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useTable).toBe(heroUseTable);
    expect(useTableColumn).toBe(heroUseTableColumn);
    expect(useTableRow).toBe(heroUseTableRow);
    expect(useTableState).toBe(heroUseTableState);
  });
});

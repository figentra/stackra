/**
 * Stackra file contract:
 * Purpose: proves the native SavedViews over a real engine: the `chips` variant is a single-choice tag row with
 *          "All records" first and the applied view chosen, and a pick applies a view or goes back to all records;
 *          the `tabs` variant does the same through the tabs; the `menu` variant picks through a select, saves the
 *          current state as a new named view, renames, makes default and deletes the active view, and refuses a blank
 *          name.
 * Boundary: React Native does not render in vitest, so it and the house parts are recording stand-ins; the engine is a
 *           real `useCollection`, read back through a readout.
 * Runtime: node
 * Governing contract: ADR 0505 (one saved-view model); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CollectionView } from "#contracts/types/collection-view.type";
import { SavedViews } from "#native/saved-views/saved-views";
import { useCollection } from "#react/hooks/use-collection";

const parts = vi.hoisted(() => {
  const props = {} as Record<string, Record<string, unknown>>;
  return {
    props,
    record: (name: string) => (given: Record<string, unknown>) => {
      parts.props[name] = given;
      return null;
    },
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": props["testID"] }, props["children"] as ReactNode),
  };
});
vi.mock("#native/tag-group/tag-group", () => ({ TagGroup: parts.record("chips") }));
vi.mock("#native/tabs/tabs", () => ({ Tabs: parts.record("tabs") }));
vi.mock("#native/select/select", () => ({ Select: parts.record("select") }));
vi.mock("#native/action-menu/action-menu", () => ({ ActionMenu: parts.record("menu") }));
vi.mock("#native/text-field/text-field", async () => {
  const { createElement } = await import("react");
  return {
    TextField: (props: Record<string, unknown>) =>
      createElement("input", {
        "aria-label": props["label"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (text: string) => void)(event.target.value),
      }),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"], disabled: props["isDisabled"] === true },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: { label?: string }) =>
    values?.label ? `${key}:${values.label}` : key,
}));

const VIEWS: readonly CollectionView[] = [
  { id: "open", label: "Open", state: { search: "open" } },
  { id: "team", label: "Team", state: {}, isShared: true },
];

/** SavedViews on an engine with two views, and a readout of the engine. */
function Harness({ variant }: { readonly variant?: "menu" | "tabs" | "chips" }) {
  const collection = useCollection({
    columns: [{ id: "name", label: "Name" }],
    views: VIEWS,
  });
  return (
    <>
      <SavedViews collection={collection} variant={variant} testID="views" />
      <output data-testid="state">
        {`${collection.state.viewId ?? "-"}|${collection.defaultViewId ?? "-"}|${collection.views.map((view) => view.label).join(",")}|${collection.state.search}`}
      </output>
    </>
  );
}

const readout = () => screen.getByTestId("state").textContent;
const call = (name: string, key: string, ...args: unknown[]) =>
  act(() => ((parts.props[name] ?? {})[key] as (...values: unknown[]) => void)(...args));
/** Runs a menu action by id. */
const action = (id: string) => {
  const sections = parts.props["menu"]?.["sections"] as readonly {
    items: readonly { id: string; onPress: () => void }[];
  }[];
  act(() => sections[0]?.items.find((item) => item.id === id)?.onPress());
};

beforeEach(() => {
  parts.props = {};
});

describe("SavedViews (native)", () => {
  it("draws the views as chips, All records first, and applies a pick", () => {
    render(<Harness variant="chips" />);
    expect(screen.getByTestId("views")).toBeTruthy();
    expect(parts.props["chips"]).toMatchObject({
      selectionMode: "single",
      value: ["__all"],
      items: [
        { id: "__all", label: "ui::collection.all_records" },
        { id: "open", label: "Open" },
        { id: "team", label: "ui::collection.shared_view:Team" },
      ],
    });
    call("chips", "onChange", ["open"]);
    expect(readout()).toBe("open|-|Open,Team|open");
    call("chips", "onChange", ["__all"]);
    expect(readout()).toBe("-|-|Open,Team|");
  });

  it("applies a view from the tabs", () => {
    render(<Harness variant="tabs" />);
    call("tabs", "onSelectionChange", ["team"]);
    expect(readout()).toBe("team|-|Open,Team|");
    expect(parts.props["tabs"]).toMatchObject({ selectedKeys: ["team"] });
  });

  it("picks, saves as, renames, makes default and deletes through the menu", () => {
    render(<Harness />);
    call("select", "onChange", "open");
    expect(readout()).toBe("open|-|Open,Team|open");
    action("save-as");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "ui::collection.save" }).disabled,
    ).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Mine" } });
    act(() => screen.getByRole("button", { name: "ui::collection.save" }).click());
    expect(readout()).toMatch(/^view-.+\|-\|Open,Team,Mine\|open$/);
    action("rename");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ours" } });
    act(() => screen.getByRole("button", { name: "ui::collection.save" }).click());
    expect(readout()).toMatch(/Open,Team,Ours/);
    action("default");
    expect(readout()).toMatch(/^(view-[^|]+)\|\1\|/);
    action("delete");
    expect(readout()).toBe("-|-|Open,Team|open");
  });
});

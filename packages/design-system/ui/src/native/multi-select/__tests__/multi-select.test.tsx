/**
 * Stackra file contract:
 * Purpose: proves the native MultiSelect names its field and reads out the chosen labels, opens its sheet on press but
 *          not when read-only, narrows the options by the search in any case and accent, toggles an option with a
 *          selection haptic, removes a chip by its named press, and shows the empty words when nothing matches.
 * Boundary: React Native does not render in vitest, so heroui-native, React Native, Reanimated, the Drawer, the
 *           ListItem, the Chip, the Icon and the haptics are replaced by stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: gap inventory row 4; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { MultiSelect } from "#native/multi-select/multi-select";

const state = vi.hoisted(() => ({
  play: vi.fn(),
  pressable: [] as Record<string, unknown>[],
  search: (_event: { target: { value: string } }): void => undefined,
}));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const wrap = (props: { children?: ReactNode }) => h("div", null, props.children);
  return {
    TextField: wrap,
    Label: wrap,
    Description: wrap,
    FieldError: wrap,
    SearchField: Object.assign(
      (props: { children?: ReactNode; onChange: (text: string) => void }) => {
        state.search = (event: { target: { value: string } }) => props.onChange(event.target.value);
        return h("div", null, props.children);
      },
      {
        Group: wrap,
        SearchIcon: () => null,
        Input: (props: Record<string, unknown>) =>
          h("input", {
            "aria-label": props["accessibilityLabel"] as string,
            onChange: (event: { target: { value: string } }) => state.search(event),
          }),
      },
    ),
    useBottomSheetAwareHandlers: () => ({ onFocus: vi.fn(), onBlur: vi.fn() }),
  };
});
vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    View: (props: { children?: ReactNode }) => h("div", null, props.children),
    Pressable: (props: Record<string, unknown>) => {
      state.pressable.push(props);
      return h(
        "button",
        {
          "aria-label": props["accessibilityLabel"] as string,
          disabled: props["disabled"] as boolean,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
    FlatList: (props: {
      data: readonly { id: string }[];
      renderItem: (info: { item: unknown }) => ReactNode;
      ListEmptyComponent: ReactNode;
    }) =>
      h(
        "ul",
        null,
        props.data.length === 0
          ? props.ListEmptyComponent
          : props.data.map((item) => h("li", { key: item.id }, props.renderItem({ item }))),
      ),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement: h } = await import("react");
  const builder: Record<string, () => unknown> = {};
  for (const name of ["springify", "duration", "reduceMotion"]) builder[name] = () => builder;
  return {
    default: { View: (props: { children?: ReactNode }) => h("div", null, props.children) },
    ZoomIn: builder,
    ZoomOut: builder,
    LinearTransition: builder,
    ReduceMotion: { System: "system" },
  };
});
// The `ui` words are spelled by key, so the test reads them without the catalogue.
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));
vi.mock("#core/constants/ui-keys.constant", () => ({
  UI_KEYS: {
    ui: {
      multi_select: { search: "search", close: "close", remove: "remove", no_matches: "none" },
    },
  },
}));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: state.play } }));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/text/text", async () => {
  const { createElement: h } = await import("react");
  return { Text: (props: { children?: ReactNode }) => h("span", null, props.children) };
});
vi.mock("#native/chip/chip", async () => {
  const { createElement: h } = await import("react");
  return { Chip: (props: { children?: ReactNode }) => h("span", null, props.children) };
});
vi.mock("#native/list/list-item", async () => {
  const { createElement: h } = await import("react");
  return {
    ListItem: (props: Record<string, unknown>) =>
      h("button", {
        role: "checkbox",
        "aria-label": props["label"] as string,
        "aria-checked": (props["accessibilityState"] as { checked: boolean }).checked,
        onClick: props["onPress"] as () => void,
      }),
  };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement: h } = await import("react");
  const wrap = (props: { children?: ReactNode }) => h("div", null, props.children);
  return {
    Drawer: Object.assign(
      (props: { isOpen: boolean; children?: ReactNode }) =>
        props.isOpen ? h("section", { "data-testid": "sheet" }, props.children) : null,
      { Header: wrap, Title: wrap, Body: wrap, Close: () => null },
    ),
  };
});

const ITEMS = [
  { id: "halal", label: "Halal" },
  { id: "vegan", label: "Vegan" },
  { id: "spicy", label: "Épicé" },
] as const;
const WORDS = {
  removeLabel: (label: string) => `Remove ${label}`,
  emptyMessage: "Nothing",
} as const;
const field = () => screen.getByRole("button", { name: "Tags" });

describe("MultiSelect (native)", () => {
  beforeEach(() => {
    state.play.mockClear();
    state.pressable = [];
  });

  it("names its field and reads out the chosen labels", () => {
    render(<MultiSelect label="Tags" items={ITEMS} defaultValue={["vegan", "halal"]} {...WORDS} />);
    const props = state.pressable.find((entry) => entry["accessibilityLabel"] === "Tags") ?? {};
    expect(props["accessibilityValue"]).toEqual({ text: "Vegan, Halal" });
  });

  it("opens its sheet on press, but not when read-only", () => {
    const { rerender } = render(<MultiSelect label="Tags" items={ITEMS} isReadOnly {...WORDS} />);
    act(() => field().click());
    expect(screen.queryByTestId("sheet")).toBeNull();
    rerender(<MultiSelect label="Tags" items={ITEMS} {...WORDS} />);
    act(() => field().click());
    expect(screen.getByTestId("sheet")).toBeTruthy();
  });

  it("toggles an option with a selection haptic and removes a chip by its named press", () => {
    const onChange = vi.fn();
    render(<MultiSelect label="Tags" items={ITEMS} onChange={onChange} {...WORDS} />);
    act(() => field().click());
    act(() => screen.getByRole("checkbox", { name: "Vegan" }).click());
    expect(onChange).toHaveBeenLastCalledWith(["vegan"]);
    expect(state.play).toHaveBeenCalledWith("selection");
    expect(screen.getByRole("checkbox", { name: "Vegan" }).getAttribute("aria-checked")).toBe(
      "true",
    );
    act(() => screen.getByRole("button", { name: "Remove Vegan" }).click());
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("narrows by the search in any case and accent, and shows the empty words", () => {
    render(<MultiSelect label="Tags" items={ITEMS} {...WORDS} />);
    act(() => field().click());
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    const search = screen.getByRole("textbox", { name: "search" });
    fireEvent.change(search, { target: { value: "EPI" } });
    expect(
      screen.getAllByRole("checkbox").map((option) => option.getAttribute("aria-label")),
    ).toEqual(["Épicé"]);
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByText("Nothing")).toBeTruthy();
  });

  it("selects every choosable option and clears them all, skipping disabled ones", () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        label="Tags"
        items={[...ITEMS, { id: "off", label: "Off", isDisabled: true }]}
        onChange={onChange}
        hasSelectAll
      />,
    );
    act(() => field().click());
    act(() => screen.getByText("ui::multi_select_more.select_all").click());
    expect(onChange).toHaveBeenLastCalledWith(["halal", "vegan", "spicy"]);
    act(() => screen.getByText("ui::multi_select_more.clear_all").click());
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("shows only maxVisible chips and names the rest, keeping the owner's value", () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        accessibilityLabel="Tags"
        label={<b>Rich</b>}
        items={ITEMS}
        value={["halal", "vegan", "spicy", "gone"]}
        maxVisible={1}
        onChange={onChange}
        isFullWidth={false}
        description="Pick some"
        errorMessage="Required"
      />,
    );
    expect(screen.getByRole("button", { name: "remove" })).toBeTruthy();
    expect(state.pressable.find((entry) => entry["accessible"])).toBeUndefined();
    expect(screen.getByText(/ui::multi_select_more.more/)).toBeTruthy();
    expect(screen.getByText("Pick some")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "remove" }).click());
    expect(onChange).toHaveBeenLastCalledWith(["vegan", "spicy", "gone"]);
    expect(screen.getAllByText(/ui::multi_select_more.more/)).toHaveLength(1);
  });

  it("locks its chips while disabled", () => {
    render(
      <MultiSelect
        label="Tags"
        items={ITEMS}
        defaultValue={["halal"]}
        isDisabled
        placeholder="Pick"
      />,
    );
    expect(state.pressable.every((entry) => entry["disabled"] === true)).toBe(true);
  });

  it("shows the placeholder with nothing chosen and the catalogue's empty words", () => {
    render(<MultiSelect label="Tags" items={[]} placeholder="Pick" hasSelectAll />);
    expect(screen.getByText("Pick")).toBeTruthy();
    act(() => field().click());
    expect(screen.queryByText(/select_all/)).toBeNull();
    expect(screen.getByText("none")).toBeTruthy();
  });
});

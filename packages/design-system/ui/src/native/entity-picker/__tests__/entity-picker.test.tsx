/**
 * Stackra file contract:
 * Purpose: proves the native EntityPicker opens its sheet on a press and asks for the first page at once, lists the
 *          records in a bounded list that keeps taps while the keyboard is up, with their description and decorative
 *          avatar; picks one record and closes, clears it when the chosen one is pressed again; toggles several and
 *          removes a tag; searches the typed text after the pause; loads the next page at the list's end with a spinner
 *          while it waits; shows and announces the empty and failed states in `Text`; offers a create-new row only for
 *          text no record already has, picking what `onCreate` returns and nothing when it rejects; wires the search
 *          to the sheet's keyboard handlers; stays shut while disabled or read-only, announcing only disabled as
 *          disabled; and keeps its own records when uncontrolled.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native (FlatList included) and the native
 *           Drawer, ListItem, TagGroup, Avatar, Icon, Spinner and Text are replaced by stand-ins that render plain DOM;
 *           the records store (`createEntityOptionsLoader` through `useEntityOptions`) runs for real.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 2 and 10); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-200
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import { EntityPicker } from "#native/entity-picker/entity-picker";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  announced: [] as string[],
  sheet: { onFocus: () => undefined, onBlur: () => undefined },
}));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const pass = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return h("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  const search = (props: Record<string, unknown>) => {
    state.props["search"] = props;
    return h("div", null, props["children"] as ReactNode);
  };
  return {
    TextField: pass("root"),
    Label: pass("label"),
    Description: pass("description"),
    FieldError: pass("error"),
    Input: (props: Record<string, unknown>) => {
      state.props["input"] = props;
      return h("input", {
        "data-testid": "input",
        value: props["value"] as string,
        readOnly: true,
      });
    },
    SearchField: Object.assign(search, {
      Group: ({ children }: { readonly children?: ReactNode }) => h("div", null, children),
      SearchIcon: () => null,
      Input: (props: Record<string, unknown>) => {
        state.props["search-input"] = props;
        const root = state.props["search"] ?? {};
        return h("input", {
          "data-testid": "search",
          value: root["value"] as string,
          onChange: (event: { target: { value: string } }) =>
            (root["onChange"] as (text: string) => void)(event.target.value),
        });
      },
    }),
    useBottomSheetAwareHandlers: () => state.sheet,
  };
});

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => state.announced.push(text),
    },
    View: ({ children }: { readonly children?: ReactNode }) => h("div", null, children),
    Pressable: (props: Record<string, unknown>) => {
      state.props["field"] = props;
      return h(
        "button",
        {
          "data-testid": "field",
          disabled: props["disabled"] as boolean,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
    FlatList: (props: {
      readonly data: readonly EntityOption[];
      readonly renderItem: (info: { readonly item: EntityOption }) => ReactElement;
      readonly ListEmptyComponent?: ReactNode;
      readonly ListFooterComponent?: ReactNode;
      readonly onEndReached?: () => void;
    }) => {
      state.props["list"] = props as unknown as Record<string, unknown>;
      return h(
        "ul",
        null,
        props.data.length === 0 ? props.ListEmptyComponent : null,
        props.data.map((item) => h("li", { key: item.id }, props.renderItem({ item }))),
        props.ListFooterComponent,
      );
    },
  };
});

vi.mock("#native/drawer/drawer", async () => {
  const { createElement: h } = await import("react");
  const part = ({ children }: { readonly children?: ReactNode }) => h("div", null, children);
  return {
    Drawer: Object.assign(
      (props: { readonly isOpen: boolean; readonly children?: ReactNode }) =>
        props.isOpen ? h("div", { "data-testid": "sheet" }, props.children) : null,
      { Header: part, Title: part, Body: part, Close: () => null },
    ),
  };
});

vi.mock("#native/list/list-item", async () => {
  const { createElement: h } = await import("react");
  return {
    ListItem: (props: {
      readonly title: string;
      readonly onPress: () => void;
      readonly accessibilityState?: { readonly checked?: boolean };
      readonly startIcon?: ReactNode;
    }) => {
      state.props[`row:${props.title}`] = props as unknown as Record<string, unknown>;
      return h("button", { onClick: props.onPress }, props.title);
    },
  };
});

vi.mock("#native/tag-group/tag-group", async () => {
  const { createElement: h } = await import("react");
  return {
    TagGroup: (props: {
      readonly items: readonly { readonly id: string; readonly label: string }[];
      readonly onRemove: (keys: readonly string[]) => void;
      readonly removeLabel: (label: string) => string;
    }) =>
      h(
        "div",
        { "data-testid": "tags" },
        props.items.map((item) =>
          h(
            "button",
            { key: item.id, onClick: () => props.onRemove([item.id]) },
            props.removeLabel(item.label),
          ),
        ),
      ),
  };
});

vi.mock("#native/avatar/avatar", async () => {
  const { createElement: h } = await import("react");
  return { Avatar: (props: { readonly name?: string }) => h("i", { "data-avatar": props.name }) };
});

vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

vi.mock("#native/spinner/spinner", async () => {
  const { createElement: h } = await import("react");
  return {
    Spinner: (props: { readonly label?: string }) =>
      h("span", { "data-testid": "spinner", "aria-label": props.label }),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement: h } = await import("react");
  return {
    Text: (props: { readonly children?: ReactNode; readonly accessibilityLiveRegion?: string }) =>
      h(
        "span",
        { "data-testid": "message", "data-live": props.accessibilityLiveRegion },
        props.children,
      ),
  };
});

const ADA: EntityOption = {
  id: "usr_ada",
  label: "Ada Lovelace",
  description: "ada@example.com",
  avatar: { name: "Ada Lovelace" },
};
const ALAN: EntityOption = { id: "usr_alan", label: "Alan Turing" };
const GRACE: EntityOption = { id: "usr_grace", label: "Grace Hopper" };

/** A load that answers `items` at once. */
const answering =
  (...items: EntityOption[]) =>
  (): Promise<EntityOptionPage> =>
    Promise.resolve({ items });

/** Lets the pending answers land. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });

const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const openSheet = () => fireEvent.click(screen.getByTestId("field"));
const listProps = () => state.props["list"] ?? {};

describe("EntityPicker (native)", () => {
  beforeEach(() => {
    state.props = {};
    state.announced = [];
  });

  it("opens its sheet on a press, asks for the first page at once and lists the records", async () => {
    const loadOptions = vi.fn(answering(ADA, ALAN));
    render(<EntityPicker label="Owner" loadOptions={loadOptions} />);
    expect(screen.queryByTestId("sheet")).toBeNull();
    openSheet();
    expect(loadOptions).toHaveBeenCalledWith("", undefined);
    await settle();
    expect(state.props["row:Ada Lovelace"]).toMatchObject({ description: "ada@example.com" });
    expect(state.props["row:Ada Lovelace"]?.["startIcon"]).toBeTruthy();
    expect(state.props["row:Alan Turing"]?.["startIcon"]).toBeUndefined();
  });

  it("bounds the list so it scrolls inside the sheet, and keeps taps while the keyboard is up", async () => {
    render(<EntityPicker label="Owner" loadOptions={answering(ADA)} />);
    openSheet();
    await settle();
    expect(listProps()).toMatchObject({
      style: { maxHeight: 320 },
      keyboardShouldPersistTaps: "handled",
      accessibilityRole: "list",
      accessibilityLabel: "Owner",
    });
  });

  it("wires its search to the sheet's keyboard handlers", () => {
    render(<EntityPicker label="Owner" loadOptions={answering()} />);
    openSheet();
    expect(state.props["search-input"]).toMatchObject({
      onFocus: state.sheet.onFocus,
      onBlur: state.sheet.onBlur,
      accessibilityLabel: "Search",
    });
  });

  it("picks one record, shows it in the field and closes; the chosen one pressed again clears it", async () => {
    const onChange = vi.fn();
    render(<EntityPicker label="Owner" loadOptions={answering(ADA, ALAN)} onChange={onChange} />);
    openSheet();
    await settle();
    expect(state.props["row:Alan Turing"]).toMatchObject({
      accessibilityRole: "radio",
      accessibilityState: { checked: false },
    });
    press("Alan Turing");
    expect(onChange).toHaveBeenLastCalledWith(ALAN);
    expect(screen.queryByTestId("sheet")).toBeNull();
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Alan Turing");
    expect(state.props["field"]?.["accessibilityValue"]).toEqual({ text: "Alan Turing" });
    openSheet();
    await settle();
    fireEvent.click(
      within(screen.getByTestId("sheet")).getByRole("button", { name: "Alan Turing" }),
    );
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("toggles several records and keeps the chosen ones the list does not show", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <EntityPicker
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        value={[GRACE]}
        loadOptions={answering(ADA, ALAN)}
        onChange={onChange}
      />,
    );
    openSheet();
    await settle();
    expect(state.props["row:Ada Lovelace"]?.["accessibilityRole"]).toBe("checkbox");
    press("Ada Lovelace");
    expect(onChange).toHaveBeenLastCalledWith([GRACE, ADA]);
    expect(screen.getByTestId("sheet")).toBeTruthy();
    rerender(
      <EntityPicker
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        value={[GRACE, ADA]}
        loadOptions={answering(ADA, ALAN)}
        onChange={onChange}
      />,
    );
    press("Ada Lovelace");
    expect(onChange).toHaveBeenLastCalledWith([GRACE]);
  });

  it("removes a record through its tag", () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        value={[GRACE, ADA]}
        loadOptions={answering()}
        onChange={onChange}
      />,
    );
    press("Remove Grace Hopper");
    expect(onChange).toHaveBeenCalledWith([ADA]);
  });

  it("searches the typed text after the pause", async () => {
    vi.useFakeTimers();
    try {
      const loadOptions = vi.fn(answering(ADA));
      render(<EntityPicker label="Owner" loadOptions={loadOptions} debounceMs={300} />);
      openSheet();
      fireEvent.change(screen.getByTestId("search"), { target: { value: "ad" } });
      expect(loadOptions).toHaveBeenCalledTimes(1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(loadOptions).toHaveBeenLastCalledWith("ad", undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it("loads the next page at the list's end, with a spinner while it waits", async () => {
    let answer: ((page: EntityOptionPage) => void) | undefined;
    const loadOptions = vi.fn((_search: string, cursor?: string) =>
      cursor === undefined
        ? Promise.resolve({ items: [ADA], nextCursor: "c2" })
        : new Promise<EntityOptionPage>((resolve) => {
            answer = resolve;
          }),
    );
    render(<EntityPicker label="Owner" loadingLabel="Loading people" loadOptions={loadOptions} />);
    openSheet();
    await settle();
    act(() => (listProps()["onEndReached"] as () => void)());
    expect(loadOptions).toHaveBeenLastCalledWith("", "c2");
    expect(screen.getByTestId("spinner").getAttribute("aria-label")).toBe("Loading people");
    expect(listProps()["onEndReached"]).toBeUndefined();
    await act(async () => answer?.({ items: [ALAN] }));
    expect(screen.queryByTestId("spinner")).toBeNull();
    expect(state.props["row:Alan Turing"]).toBeTruthy();
    expect(listProps()["onEndReached"]).toBeUndefined();
  });

  it("is busy while it waits, then says and announces that nothing matches", async () => {
    let answer: ((page: EntityOptionPage) => void) | undefined;
    render(
      <EntityPicker
        label="Owner"
        emptyMessage="No people found"
        loadOptions={() =>
          new Promise((resolve) => {
            answer = resolve;
          })
        }
      />,
    );
    openSheet();
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(screen.queryByTestId("message")).toBeNull();
    await act(async () => answer?.({ items: [] }));
    expect(screen.queryByTestId("spinner")).toBeNull();
    expect(screen.getByTestId("message").textContent).toBe("No people found");
    expect(screen.getByTestId("message").getAttribute("data-live")).toBe("polite");
    expect(state.announced).toEqual(["No people found"]);
  });

  it("drops the empty message while a new search loads", async () => {
    let answer: ((page: EntityOptionPage) => void) | undefined;
    const loadOptions = vi.fn((search: string) =>
      search === ""
        ? Promise.resolve({ items: [] })
        : new Promise<EntityOptionPage>((resolve) => {
            answer = resolve;
          }),
    );
    render(
      <EntityPicker
        label="Owner"
        emptyMessage="No people found"
        debounceMs={0}
        loadOptions={loadOptions}
      />,
    );
    openSheet();
    await settle();
    expect(screen.getByTestId("message")).toBeTruthy();
    fireEvent.change(screen.getByTestId("search"), { target: { value: "ad" } });
    await settle();
    expect(loadOptions).toHaveBeenLastCalledWith("ad", undefined);
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(screen.queryByTestId("message")).toBeNull();
    await act(async () => answer?.({ items: [ADA] }));
    expect(state.props["row:Ada Lovelace"]).toBeTruthy();
  });

  it("shows and announces the failure message when the load rejects", async () => {
    render(
      <EntityPicker
        label="Owner"
        loadErrorMessage="People could not be loaded"
        loadOptions={() => Promise.reject(new Error("down"))}
      />,
    );
    openSheet();
    await settle();
    expect(screen.getByTestId("message").textContent).toBe("People could not be loaded");
    expect(screen.queryByRole("list")).toBeNull();
    expect(state.announced).toEqual(["People could not be loaded"]);
  });

  it("offers a create-new row for typed text and picks what onCreate returns", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn((text: string) => ({ id: "usr_new", label: text }));
    render(
      <EntityPicker
        label="Owner"
        loadOptions={answering()}
        onCreate={onCreate}
        createLabel={(text) => `Add "${text}"`}
        onChange={onChange}
      />,
    );
    openSheet();
    expect(screen.queryByRole("button", { name: /^Add/ })).toBeNull();
    fireEvent.change(screen.getByTestId("search"), { target: { value: " Linus " } });
    press('Add "Linus"');
    await settle();
    expect(onCreate).toHaveBeenCalledWith("Linus");
    expect(onChange).toHaveBeenCalledWith({ id: "usr_new", label: "Linus" });
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("offers no create-new row for text a listed or chosen record already has", async () => {
    render(
      <EntityPicker
        label="Owner"
        value={GRACE}
        loadOptions={answering(ADA)}
        onCreate={() => undefined}
        createLabel={(text) => `Add "${text}"`}
      />,
    );
    openSheet();
    await settle();
    fireEvent.change(screen.getByTestId("search"), { target: { value: "ada lovelace" } });
    expect(screen.queryByRole("button", { name: /^Add/ })).toBeNull();
    fireEvent.change(screen.getByTestId("search"), { target: { value: "GRACE HOPPER" } });
    expect(screen.queryByRole("button", { name: /^Add/ })).toBeNull();
  });

  it("picks nothing when onCreate rejects", async () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        label="Owner"
        loadOptions={answering()}
        onCreate={() => Promise.reject(new Error("taken"))}
        createLabel={(text) => `Add "${text}"`}
        onChange={onChange}
      />,
    );
    openSheet();
    fireEvent.change(screen.getByTestId("search"), { target: { value: "Linus" } });
    press('Add "Linus"');
    await settle();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    [{ isDisabled: true }, true],
    [{ isReadOnly: true }, false],
  ])("stays shut while %o, announced as disabled: %s", (locked, isAnnouncedDisabled) => {
    render(<EntityPicker label="Owner" loadOptions={answering(ADA)} {...locked} />);
    // Pressable writes `disabled` over the announced state, so only a disabled field sets it.
    expect(state.props["field"]).toMatchObject({
      disabled: isAnnouncedDisabled,
      accessibilityState: { disabled: isAnnouncedDisabled },
    });
    openSheet();
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("sizes to its content unless asked to fill the width", () => {
    const { rerender } = render(<EntityPicker label="Owner" loadOptions={answering()} />);
    expect(state.props["root"]?.["className"]).toBe("self-start");
    rerender(<EntityPicker label="Owner" isFullWidth loadOptions={answering()} />);
    expect(state.props["root"]?.["className"]).toBe("");
  });

  it("keeps its own record when uncontrolled", async () => {
    render(<EntityPicker label="Owner" defaultValue={ADA} loadOptions={answering(ADA, ALAN)} />);
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Ada Lovelace");
    openSheet();
    await settle();
    press("Alan Turing");
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Alan Turing");
  });

  it("asks a multiple picker for the spoken name of a tag's remove button", () => {
    // @ts-expect-error a multiple picker draws removable tags, so it needs `removeLabel`
    void (<EntityPicker label="x" selectionMode="multiple" loadOptions={answering()} />);
  });
});

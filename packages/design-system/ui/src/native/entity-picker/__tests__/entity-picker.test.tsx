/**
 * Stackra file contract:
 * Purpose: proves the native EntityPicker opens its sheet on a press and asks for the first page at once, lists the
 *          records with their description and decorative avatar, picks one record and closes, toggles several and
 *          keeps the chosen records the list does not show, removes a tag, searches the typed text after the pause,
 *          shows the loading, empty and failed states (strings in `Text`), offers a create-new row that picks what
 *          `onCreate` returns and nothing when it rejects, stays shut while disabled or read-only, and keeps its own
 *          records when uncontrolled.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the native Drawer, SearchField,
 *           List, ListItem, TagGroup, Avatar, Icon and Text are replaced by stand-ins that render plain DOM; the records
 *           store (`createEntityOptionsLoader` through `useEntityOptions`) runs for real.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 2 and 10); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-200
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import { EntityPicker } from "#native/entity-picker/entity-picker";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const pass = (name: string) => (props: Record<string, unknown>) => {
    state.props[name] = props;
    return h("div", { "data-testid": name }, props["children"] as ReactNode);
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
  };
});

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  return {
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

vi.mock("#native/search-field/search-field", async () => {
  const { createElement: h } = await import("react");
  return {
    SearchField: (props: { readonly value: string; readonly onChange: (text: string) => void }) =>
      h("input", {
        "data-testid": "search",
        value: props.value,
        onChange: (event: { target: { value: string } }) => props.onChange(event.target.value),
      }),
  };
});

vi.mock("#native/list/list", async () => {
  const { createElement: h } = await import("react");
  return {
    List: (props: {
      readonly items: readonly { readonly id: string; readonly title: string }[];
      readonly selectionMode: "single" | "multiple";
      readonly selectedKeys: readonly string[];
      readonly onSelectionChange: (keys: readonly string[]) => void;
      readonly emptyState?: ReactNode;
    }) => {
      state.props["list"] = props as unknown as Record<string, unknown>;
      const toggle = (id: string) =>
        props.onSelectionChange(
          props.selectedKeys.includes(id)
            ? props.selectedKeys.filter((key) => key !== id)
            : props.selectionMode === "single"
              ? [id]
              : [...props.selectedKeys, id],
        );
      return props.items.length === 0
        ? h("div", { "data-testid": "empty" }, props.emptyState)
        : h(
            "ul",
            null,
            props.items.map((item) =>
              h(
                "li",
                { key: item.id },
                h("button", { onClick: () => toggle(item.id) }, item.title),
              ),
            ),
          );
    },
  };
});

vi.mock("#native/list/list-item", async () => {
  const { createElement: h } = await import("react");
  return {
    ListItem: (props: { readonly title: string; readonly onPress: () => void }) =>
      h("button", { onClick: props.onPress }, props.title),
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

vi.mock("#native/text/text", async () => {
  const { createElement: h } = await import("react");
  return {
    Text: ({ children }: { readonly children?: ReactNode }) =>
      h("span", { "data-testid": "text" }, children),
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
    await Promise.resolve();
    await Promise.resolve();
  });

const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("EntityPicker (native)", () => {
  beforeEach(() => {
    state.props = {};
  });

  it("opens its sheet on a press and asks for the first page at once", async () => {
    const loadOptions = vi.fn(answering(ADA, ALAN));
    render(<EntityPicker label="Owner" loadOptions={loadOptions} />);
    expect(screen.queryByTestId("sheet")).toBeNull();
    fireEvent.click(screen.getByTestId("field"));
    expect(loadOptions).toHaveBeenCalledWith("", undefined);
    await settle();
    expect(screen.getByRole("button", { name: "Ada Lovelace" })).toBeTruthy();
    const items = (state.props["list"]?.["items"] ?? []) as Record<string, unknown>[];
    expect(items[0]).toMatchObject({ title: "Ada Lovelace", description: "ada@example.com" });
    expect(items[1]?.["startIcon"]).toBeUndefined();
  });

  it("picks one record, reports it, shows it in the field and closes", async () => {
    const onChange = vi.fn();
    render(<EntityPicker label="Owner" loadOptions={answering(ADA, ALAN)} onChange={onChange} />);
    fireEvent.click(screen.getByTestId("field"));
    await settle();
    press("Alan Turing");
    expect(onChange).toHaveBeenCalledWith(ALAN);
    expect(screen.queryByTestId("sheet")).toBeNull();
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Alan Turing");
    expect(state.props["field"]?.["accessibilityValue"]).toEqual({ text: "Alan Turing" });
  });

  it("toggles several records and keeps the chosen ones the list does not show", async () => {
    const onChange = vi.fn();
    render(
      <EntityPicker
        label="Reviewers"
        selectionMode="multiple"
        removeLabel={(name) => `Remove ${name}`}
        value={[GRACE]}
        loadOptions={answering(ADA, ALAN)}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId("field"));
    await settle();
    press("Ada Lovelace");
    expect(onChange).toHaveBeenLastCalledWith([GRACE, ADA]);
    expect(screen.getByTestId("sheet")).toBeTruthy();
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
      fireEvent.click(screen.getByTestId("field"));
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

  it("is busy while it waits, then says that nothing matches, in Text", async () => {
    let answer: (page: EntityOptionPage) => void = () => {};
    render(
      <EntityPicker
        label="Owner"
        emptyMessage="No people found"
        loadOptions={() => new Promise((resolve) => (answer = resolve))}
      />,
    );
    fireEvent.click(screen.getByTestId("field"));
    expect(state.props["list"]?.["isLoading"]).toBe(true);
    await act(async () => answer({ items: [] }));
    expect(state.props["list"]?.["isLoading"]).toBe(false);
    expect(screen.getByTestId("empty").textContent).toBe("No people found");
    expect(screen.getByTestId("text").textContent).toBe("No people found");
  });

  it("shows the failure message in Text when the load rejects", async () => {
    render(
      <EntityPicker
        label="Owner"
        loadErrorMessage="People could not be loaded"
        loadOptions={() => Promise.reject(new Error("down"))}
      />,
    );
    fireEvent.click(screen.getByTestId("field"));
    await settle();
    expect(screen.getByTestId("text").textContent).toBe("People could not be loaded");
    expect(screen.queryByTestId("empty")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
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
    fireEvent.click(screen.getByTestId("field"));
    expect(screen.queryByRole("button", { name: /^Add/ })).toBeNull();
    fireEvent.change(screen.getByTestId("search"), { target: { value: " Linus " } });
    press('Add "Linus"');
    await settle();
    expect(onCreate).toHaveBeenCalledWith("Linus");
    expect(onChange).toHaveBeenCalledWith({ id: "usr_new", label: "Linus" });
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
    fireEvent.click(screen.getByTestId("field"));
    fireEvent.change(screen.getByTestId("search"), { target: { value: "Linus" } });
    press('Add "Linus"');
    await settle();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([{ isDisabled: true }, { isReadOnly: true }])("stays shut while %o", (locked) => {
    const loadOptions = vi.fn(answering(ADA));
    render(<EntityPicker label="Owner" loadOptions={loadOptions} {...locked} />);
    expect(state.props["field"]?.["disabled"]).toBe(true);
    fireEvent.click(screen.getByTestId("field"));
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("keeps its own record when uncontrolled", async () => {
    render(<EntityPicker label="Owner" defaultValue={ADA} loadOptions={answering(ADA, ALAN)} />);
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Ada Lovelace");
    fireEvent.click(screen.getByTestId("field"));
    await settle();
    press("Alan Turing");
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("Alan Turing");
  });

  it("asks a multiple picker for the spoken name of a tag's remove button", () => {
    // @ts-expect-error a multiple picker draws removable tags, so it needs `removeLabel`
    void (<EntityPicker label="x" selectionMode="multiple" loadOptions={answering()} />);
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the web TagGroup names its list by its label or `aria-label`, ties the description to it and swaps it
 *          for the error message while invalid, draws one tag per item in HeroUI's default and given sizes and variants,
 *          selects none, one or several tags and reports the keys as a list (controlled or not), gives a removal
 *          handler a remove button named by `removeLabel` and none without it, turns selection and removal off while
 *          read-only and every tag off while disabled, says what an empty group says, submits the selection under its
 *          name, passes unknown props and the ref through, and refuses HeroUI's selected keys, children and a removal
 *          handler without a name for its button.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-080
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import { TagVariant } from "#contracts/enums/tag-variant.enum";
import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";
import { TagGroup, type TagGroupProps } from "#react/tag-group/tag-group";

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS = [
  { id: "news", label: "News" },
  { id: "travel", label: "Travel" },
  { id: "gaming", label: "Gaming", isDisabled: true },
] as const;

const tags = () => [...document.querySelectorAll<HTMLElement>('[data-slot="tag"]')];
const selected = () =>
  tags()
    .filter((tag) => tag.getAttribute("aria-selected") === "true")
    .map((tag) => tag.getAttribute("data-key"));
const row = (name: string) => screen.getByRole("row", { name });

describe("TagGroup (web)", () => {
  it("names the list by its label and ties the description to it", () => {
    render(<TagGroup items={ITEMS} label="Topics" description="What the post is about" />);
    const list = screen.getByRole("grid", { name: "Topics" });
    expect(list.getAttribute("aria-describedby")).toContain(
      screen.getByText("What the post is about").id,
    );
  });

  it("is named by aria-label when there is no visible label", () => {
    render(<TagGroup items={ITEMS} aria-label="Post topics" />);
    expect(screen.getByRole("grid", { name: "Post topics" })).toBeTruthy();
  });

  it("shows the error message in the description's place only while invalid", () => {
    const { rerender } = render(
      <TagGroup items={ITEMS} label="Topics" description="Hint" errorMessage="Pick a topic" />,
    );
    expect(screen.getByText("Hint")).toBeTruthy();
    expect(screen.queryByText("Pick a topic")).toBeNull();
    rerender(
      <TagGroup
        items={ITEMS}
        label="Topics"
        description="Hint"
        errorMessage="Pick a topic"
        isInvalid
      />,
    );
    expect(screen.queryByText("Hint")).toBeNull();
    const list = screen.getByRole("grid", { name: "Topics" });
    expect(list.getAttribute("aria-describedby")).toContain(screen.getByText("Pick a topic").id);
    expect(
      document.querySelector('[data-slot="label"]')?.classList.contains("label--invalid"),
    ).toBe(true);
  });

  it("marks a required label", () => {
    render(<TagGroup items={ITEMS} label="Topics" isRequired />);
    expect(
      document.querySelector('[data-slot="label"]')?.classList.contains("label--required"),
    ).toBe(true);
  });

  it("draws one tag per item, medium and default unless told otherwise", () => {
    render(<TagGroup items={ITEMS} label="Topics" />);
    expect(tags().map((tag) => tag.getAttribute("data-key"))).toEqual(["news", "travel", "gaming"]);
    for (const tag of tags()) {
      expect(tag.classList.contains("tag--md")).toBe(true);
      expect(tag.classList.contains("tag--default")).toBe(true);
    }
  });

  it.each(Size)("draws the %s size and every variant as HeroUI's classes", (size) => {
    for (const variant of TagVariant) {
      const { unmount } = render(
        <TagGroup items={ITEMS} label="Topics" size={size} variant={variant} />,
      );
      for (const tag of tags()) {
        expect(tag.classList.contains(`tag--${size}`), `${variant} ${size}`).toBe(true);
        expect(tag.classList.contains(`tag--${variant}`), `${variant} ${size}`).toBe(true);
      }
      unmount();
    }
  });

  it("selects nothing by default: a plain list of tags", () => {
    render(<TagGroup items={ITEMS} label="Topics" />);
    press(row("News"));
    expect(selected()).toEqual([]);
    expect(row("News").getAttribute("aria-selected")).toBeNull();
  });

  it("selects one tag at a time in single mode and reports the keys as a list", () => {
    const onChange = vi.fn();
    render(<TagGroup items={ITEMS} label="Topics" selectionMode="single" onChange={onChange} />);
    press(row("News"));
    expect(onChange).toHaveBeenLastCalledWith(["news"]);
    press(row("Travel"));
    expect(onChange).toHaveBeenLastCalledWith(["travel"]);
    expect(selected()).toEqual(["travel"]);
  });

  it("toggles several tags in multiple mode, from `defaultValue`", () => {
    const onChange = vi.fn();
    render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        defaultValue={["news"]}
        onChange={onChange}
      />,
    );
    expect(selected()).toEqual(["news"]);
    press(row("Travel"));
    expect(onChange).toHaveBeenLastCalledWith(["news", "travel"]);
    press(row("News"));
    expect(onChange).toHaveBeenLastCalledWith(["travel"]);
  });

  it("follows `value` when controlled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        value={["news"]}
        onChange={onChange}
      />,
    );
    press(row("Travel"));
    expect(onChange).toHaveBeenLastCalledWith(["news", "travel"]);
    expect(selected()).toEqual(["news"]);
    rerender(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        value={["travel"]}
        onChange={onChange}
      />,
    );
    expect(selected()).toEqual(["travel"]);
  });

  it("refuses a disabled tag", () => {
    const onChange = vi.fn();
    render(<TagGroup items={ITEMS} label="Topics" selectionMode="multiple" onChange={onChange} />);
    expect(row("Gaming").getAttribute("aria-disabled")).toBe("true");
    press(row("Gaming"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("gives each tag a remove button named by `removeLabel`, and reports what was removed", () => {
    const onRemove = vi.fn();
    render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        onRemove={onRemove}
        removeLabel={(tag) => `Remove ${tag}`}
      />,
    );
    expect(
      screen
        .getAllByRole("button", { name: /^Remove / })
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Remove News", "Remove Travel", "Remove Gaming"]);
    press(screen.getByRole("button", { name: "Remove Travel" }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(["travel"]);
  });

  it("has no remove button without a removal handler", () => {
    render(<TagGroup items={ITEMS} label="Topics" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("turns selection and removal off while read-only", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        defaultValue={["news"]}
        isReadOnly
        onChange={onChange}
        onRemove={onRemove}
        removeLabel={(tag) => `Remove ${tag}`}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    press(row("Travel"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("turns every tag off while disabled", () => {
    render(<TagGroup items={ITEMS} label="Topics" selectionMode="multiple" isDisabled />);
    for (const tag of tags()) expect(tag.getAttribute("aria-disabled")).toBe("true");
  });

  it("says what an empty group says, and nothing without a message", () => {
    const { rerender } = render(
      <TagGroup items={[]} label="Topics" emptyMessage="No topics yet" />,
    );
    expect(screen.getByText("No topics yet")).toBeTruthy();
    rerender(<TagGroup items={[]} label="Topics" />);
    expect(screen.queryByText("No topics yet")).toBeNull();
  });

  it("submits the selection under its name, one entry per key", () => {
    const { container } = render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        defaultValue={["news"]}
        name="topics"
      />,
    );
    press(row("Travel"));
    const entries = [...container.querySelectorAll<HTMLInputElement>("input[type=hidden]")];
    expect(entries.map((input) => [input.name, input.value])).toEqual([
      ["topics", "news"],
      ["topics", "travel"],
    ]);
  });

  it("leaves a disabled group out of the submit", () => {
    const { container } = render(
      <TagGroup
        items={ITEMS}
        label="Topics"
        selectionMode="multiple"
        value={["news"]}
        name="t"
        isDisabled
      />,
    );
    expect(container.querySelector("input[type=hidden]")).toBeNull();
  });

  it("passes unknown props and the ref through", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <TagGroup ref={ref} items={ITEMS} label="Topics" data-testid="group" className="mine" />,
    );
    const root = container.querySelector('[data-slot="tag-group"]');
    expect(root?.getAttribute("data-testid")).toBe("group");
    expect(root?.classList.contains("mine")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses HeroUI's selection, children and an unnamed removal", () => {
    expectTypeOf<TagGroupProps>().toExtend<TagGroupContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error the selection is `value`
    void (<TagGroup items={ITEMS} selectedKeys={new Set(["news"])} />);
    // @ts-expect-error tags are `items`, never children
    void (<TagGroup items={ITEMS}>x</TagGroup>);
    // @ts-expect-error a remove button needs a spoken name
    void (<TagGroup items={ITEMS} onRemove={() => undefined} />);
    // @ts-expect-error without a removal handler there is no button to name
    void (<TagGroup items={ITEMS} removeLabel={(tag: string) => tag} />);
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the native ItemCard and ItemCardGroup: a card draws its icon, title, muted line and end (text or a
 *          node); without `onPress` it is a framed view, with it a button named by the title, hinted by the line,
 *          with a chevron, that refuses while disabled; in a group the cards drop their own frame and sit in one
 *          surface with separators between them, under the group's header and above its footnote.
 * Boundary: React Native does not render in vitest, so it and the house Icon and Text are recording stand-ins that
 *           render plain DOM; what each is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ItemCard } from "#native/item-card/item-card";
import { ItemCardGroup } from "#native/item-card/item-card-group";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  button: undefined as Record<string, unknown> | undefined,
  icons: [] as string[],
  texts: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement(
        "button",
        {
          type: "button",
          onClick: props["disabled"] ? undefined : (props["onPress"] as () => void),
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/icon/icon", () => ({
  Icon: (props: { name: string }) => {
    state.icons.push(props.name);
    return null;
  },
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});

beforeEach(() => {
  state.views.length = 0;
  state.button = undefined;
  state.icons.length = 0;
  state.texts.length = 0;
});

describe("ItemCard (native)", () => {
  it("is a framed view with its icon, title, line and end words", () => {
    render(
      <ItemCard title="Storage" description="12 GB" icon="hard-drive" end="Manage" className="c" />,
    );
    expect(state.button).toBeUndefined();
    expect(String(state.views[0]?.["className"])).toContain(
      "rounded-[var(--radius-container)] border",
    );
    expect(String(state.views[0]?.["className"])).toContain(" c");
    expect(state.icons).toEqual(["hard-drive"]);
    expect(screen.getByText("Storage")).toBeTruthy();
    expect(screen.getByText("12 GB")).toBeTruthy();
    expect(screen.getByText("Manage")).toBeTruthy();
  });

  it("is a named, hinted button with a chevron when it takes a press", () => {
    const onPress = vi.fn();
    render(
      <ItemCard title="Profile" description="Name, photo" end={<b>new</b>} onPress={onPress} />,
    );
    expect(state.button).toMatchObject({
      accessibilityRole: "button",
      accessibilityLabel: "Profile",
      accessibilityHint: "Name, photo",
      accessibilityState: { disabled: false },
    });
    expect(String(state.button?.["className"])).toContain("active:bg-default");
    expect(state.icons).toEqual(["chevron-right"]);
    expect(screen.getByText("new")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("refuses and dims while disabled", () => {
    const onPress = vi.fn();
    render(<ItemCard title="Profile" onPress={onPress} isDisabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
    expect(state.button).toMatchObject({ disabled: true, accessibilityState: { disabled: true } });
    expect(String(state.button?.["className"])).toContain("opacity-50");
    expect(state.texts).toHaveLength(1);
  });
});

describe("ItemCardGroup (native)", () => {
  it("joins its cards in one surface with separators, under a header and above a footnote", () => {
    render(
      <ItemCardGroup title="Account" description="Synced" className="g">
        <ItemCard title="One" />
        <ItemCard title="Two" />
      </ItemCardGroup>,
    );
    expect(state.views[0]?.["className"]).toBe("gap-2 g");
    expect(state.texts.find((text) => text["accessibilityRole"] === "header")?.["children"]).toBe(
      "Account",
    );
    expect(screen.getByText("Synced")).toBeTruthy();
    const rows = state.views.filter(
      (view) => view["className"] === "" || view["className"] === "border-t border-separator",
    );
    expect(rows.map((row) => row["className"])).toEqual(["", "border-t border-separator"]);
    const cards = state.views.filter((view) => String(view["className"]).startsWith("min-h-14"));
    expect(
      cards.every(
        (card) => !String(card["className"]).includes("rounded-[var(--radius-container)]"),
      ),
    ).toBe(true);
  });

  it("draws no header or footnote it is not given", () => {
    render(
      <ItemCardGroup>
        <ItemCard title="Only" />
      </ItemCardGroup>,
    );
    expect(state.texts.map((text) => text["children"])).toEqual(["Only"]);
  });
});

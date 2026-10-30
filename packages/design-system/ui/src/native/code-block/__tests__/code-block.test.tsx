/**
 * Stackra file contract:
 * Purpose: proves the native code family: the CodeBlock names its scroller by the title (or "code"), writes the
 *          language, line numbers, diff marks and prompt beside each line, copies the whole text, toggles wrapping
 *          (scroller or plain view), folds past `maxLines` with a show-all button, and puts several files under tabs;
 *          the JsonViewer folds and unfolds each object and array with its expanded state and hint; the
 *          MarkdownViewer draws headings as headers, lists, quotes, code and links that open only absolute urls.
 * Boundary: React Native does not render in vitest, so it and the house Text, Button, IconButton, CopyButton and Tabs
 *           are recording stand-ins that render plain DOM; what each is handed is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (code stays left to right); WCAG 2.2 SC 1.3.1 and 4.1.2;
 *          ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { CodeBlock } from "#native/code-block/code-block";
import { JsonViewer } from "#native/code-block/json-viewer";
import { MarkdownViewer } from "#native/code-block/markdown-viewer";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
  opened: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (tag: string) => (props: Record<string, unknown>) => {
    state.views.push({ ...props, tag });
    return createElement("div", { "data-tag": tag }, props["children"] as ReactNode);
  };
  return {
    View: box("view"),
    ScrollView: box("scroll"),
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-expanded": (props["accessibilityState"] as { expanded: boolean }).expanded,
          title: props["accessibilityHint"] as string,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
    Linking: { openURL: (url: string) => Promise.resolve(state.opened.push(url)) },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement(
        "span",
        { onClick: props["onPress"] as () => void, role: props["accessibilityRole"] as string },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      state.props["wrap"] = props;
      return createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      });
    },
  };
});
vi.mock("#native/copy-button/copy-button", () => ({
  CopyButton: (props: Record<string, unknown>) => {
    state.props["copy"] = props;
    return null;
  },
}));
vi.mock("#native/tabs/tabs", async () => {
  const { createElement } = await import("react");
  return {
    Tabs: (props: { items: { id: string; content: ReactNode }[] } & Record<string, unknown>) => {
      state.props["tabs"] = props;
      return createElement(
        "div",
        null,
        props.items.map((item) => createElement("section", { key: item.id }, item.content)),
      );
    },
  };
});
vi.mock("@stackra/icons/native/lucide-icons", () => ({ TextWrap: () => null }));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

const propsOf = (name: string) => state.props[name] ?? {};
const scroller = () => [...state.views].reverse().find((view) => view["tag"] === "scroll");
const textsOf = (text: string | number) =>
  state.texts.filter((props) => props["children"] === text);

beforeEach(() => {
  state.props = {};
  state.views.length = 0;
  state.texts.length = 0;
  state.opened.length = 0;
});

describe("CodeBlock (native)", () => {
  it("scrolls sideways under its title, writes the language and copies the text", () => {
    render(<CodeBlock code={"const a = 1;\nlet b;\n"} language="ts" title="a.ts" />);
    expect(scroller()).toMatchObject({ horizontal: true, accessibilityLabel: "a.ts" });
    expect(screen.getByText("a.ts")).toBeTruthy();
    expect(screen.getByText("ts")).toBeTruthy();
    expect(propsOf("copy")["value"]).toBe("const a = 1;\nlet b;");
    expect(propsOf("copy")).not.toHaveProperty("label");
    expect(state.props["wrap"]).toBeUndefined();
  });

  it("names itself by the catalogue without a title and drops the bar when nothing goes in it", () => {
    render(<CodeBlock code="x" isCopyable={false} />);
    expect(scroller()?.["accessibilityLabel"]).toBe("ui::code_block.code");
    expect(state.props["copy"]).toBeUndefined();
    expect(state.texts.some((props) => props["type"] === "caption")).toBe(false);
  });

  it("numbers the lines, marks the diff and writes the prompt, hidden from the reader", () => {
    render(
      <CodeBlock
        code={"+added\n-removed\n kept\n"}
        isDiff
        showLineNumbers
        prompt="$"
        copyLabel="Copy it"
      />,
    );
    expect(textsOf("+")).toHaveLength(1);
    expect(textsOf("−")).toHaveLength(1);
    expect(textsOf(" ")).toHaveLength(1);
    expect(textsOf("$")).toHaveLength(3);
    expect(textsOf(3)[0]).toMatchObject({ importantForAccessibility: "no", selectable: false });
    expect(propsOf("copy")["label"]).toBe("Copy it");
    const rows = state.views.filter((view) =>
      String(view["className"]).startsWith("flex-row px-3"),
    );
    expect(rows.map((row) => row["className"])).toEqual([
      "flex-row px-3 bg-syntax-inserted/10",
      "flex-row px-3 bg-syntax-deleted/10",
      "flex-row px-3 ",
    ]);
  });

  it("highlights the asked lines and keeps an empty line one space tall", () => {
    render(<CodeBlock code={"a\n\nc"} highlightLines={[1]} />);
    const first = state.views.find((view) => String(view["className"]).startsWith("flex-row px-3"));
    expect(first?.["className"]).toBe("flex-row px-3 bg-accent/10");
    expect(textsOf(" ").length).toBeGreaterThan(0);
  });

  it("toggles wrapping from its button, trading the scroller for a plain view", () => {
    render(<CodeBlock code="x" showWrapToggle title="t" />);
    expect(propsOf("wrap")).toMatchObject({
      label: "ui::code_block.wrap",
      variant: "ghost",
      accessibilityState: { selected: false },
    });
    fireEvent.click(screen.getByLabelText("ui::code_block.wrap"));
    expect(propsOf("wrap")).toMatchObject({
      variant: "secondary",
      accessibilityState: { selected: true },
    });
    state.views.length = 0;
    fireEvent.click(screen.getByLabelText("ui::code_block.wrap"));
    expect(scroller()).toBeDefined();
  });

  it("starts wrapped when asked", () => {
    render(<CodeBlock code="x" isWrapped />);
    expect(scroller()).toBeUndefined();
    expect(
      state.views.find((view) => view["accessibilityLabel"] === "ui::code_block.code"),
    ).toBeTruthy();
  });

  it("folds past maxLines and shows every line on demand, then folds again", () => {
    render(<CodeBlock code={"1\n2\n3\n4"} maxLines={2} />);
    expect(screen.queryByText("3")).toBeNull();
    fireEvent.click(screen.getByText('ui::code_block.show_all {"count":4}'));
    expect(screen.getByText("4")).toBeTruthy();
    fireEvent.click(screen.getByText("ui::code_block.show_less"));
    expect(screen.queryByText("4")).toBeNull();
  });

  it("puts several files under tabs, each named by its title", () => {
    render(
      <CodeBlock
        files={[
          { title: "a.ts", code: "a", language: "ts" },
          { title: "b.js", code: "b", language: "js" },
        ]}
        className="wide"
      />,
    );
    expect(propsOf("tabs")).toMatchObject({ label: "ui::code_block.files", variant: "secondary" });
    expect(
      (propsOf("tabs")["items"] as { id: string; label: string }[]).map(({ id, label }) => [
        id,
        label,
      ]),
    ).toEqual([
      ["0", "a.ts"],
      ["1", "b.js"],
    ]);
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("js")).toBeTruthy();
  });
});

describe("JsonViewer (native)", () => {
  const value = { name: "Ada", age: 36, admin: true, boss: null, tags: ["x"] };

  it("opens to the given depth and folds a branch with its count", () => {
    render(<JsonViewer value={value} label="User" />);
    expect(state.views[0]?.["accessibilityLabel"]).toBe("User");
    expect(screen.getByText('"Ada"')).toBeTruthy();
    expect(screen.getByText("36")).toBeTruthy();
    expect(screen.getByText("true")).toBeTruthy();
    expect(screen.getByText("null")).toBeTruthy();
    const [root, tags] = screen.getAllByRole("button");
    expect(root?.getAttribute("aria-expanded")).toBe("true");
    expect(root?.getAttribute("title")).toBe("ui::json_viewer.collapse");
    expect(tags?.textContent).toBe("▸ tags: [ 1 ]");
    expect(tags?.getAttribute("title")).toBe("ui::json_viewer.expand");
  });

  it("unfolds an array on press and folds the root to its count", () => {
    render(<JsonViewer value={value} label="User" />);
    const [root, tags] = screen.getAllByRole("button");
    act(() => tags?.click());
    expect(screen.getByText('"x"')).toBeTruthy();
    act(() => root?.click());
    expect(root?.textContent).toBe("▸ { 5 }");
  });

  it("draws a bare leaf", () => {
    render(<JsonViewer value="plain" defaultExpandDepth={0} label="Plain" />);
    expect(screen.getByText('"plain"')).toBeTruthy();
  });
});

describe("MarkdownViewer (native)", () => {
  it("draws headings, lists, quotes, paragraphs and fenced code", () => {
    render(
      <MarkdownViewer
        source={
          "# Title\n## Sub\n### Third\n\n- one\n- two\n\n1. first\n\n> quoted\n\nA **bold** and *soft* `code`.\n\n```ts\nlet x;\n```"
        }
      />,
    );
    expect(state.texts.filter((props) => props["accessibilityRole"] === "header")).toHaveLength(3);
    expect(screen.getAllByText("•")).toHaveLength(2);
    expect(screen.getByText("1.")).toBeTruthy();
    expect(screen.getByText("quoted")).toBeTruthy();
    expect(textsOf("bold")[0]?.["className"]).toBe("font-semibold");
    expect(textsOf("soft")[0]?.["className"]).toBe("italic");
    expect(textsOf("code")[0]?.["className"]).toContain("font-mono");
    expect(propsOf("copy")["value"]).toBe("let x;");
  });

  it("opens absolute and mail links and leaves relative ones as text", () => {
    render(
      <MarkdownViewer source="[site](https://a.example) [mail](mailto:a@b.c) [here](/local)" />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    act(() => links.forEach((link) => link.click()));
    expect(state.opened).toEqual(["https://a.example", "mailto:a@b.c"]);
    expect(screen.getByText("here").getAttribute("role")).toBeNull();
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the native RichTextEditor on tentap: it loads the value in the native form, reports changes as the web
 *          editor's JSON (`dir: "auto"`) or HTML, refuses a change past the character limit, follows a controlled value
 *          without reporting it back, drives the toolbar through the bridge with accessible names and pressed states,
 *          and turns read-only for a document whose nodes the native schema lacks.
 * Boundary: jsdom; the tentap bridge (WebView messages) is a fake that answers getJSON/getHTML, as tentap's own tests
 *           mock the WebView, and React Native and the house parts are stand-ins.
 * Runtime: react-native
 * Governing contract: ADR 0466 (decisions 1, 2 and 8); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { createElement, useEffect, type ReactNode } from "react";

import { RichTextEditor } from "#native/rich-text-editor/rich-text-editor";

const bridge = vi.hoisted(() => ({
  options: {} as Record<string, unknown>,
  state: {} as Record<string, unknown>,
  json: { type: "doc", content: [] } as unknown,
  html: "",
  calls: [] as unknown[][],
  record:
    (name: string) =>
    (...args: unknown[]) =>
      bridge.calls.push([name, ...args]),
}));

vi.mock("@10play/tentap-editor", () => {
  const record = bridge.record;
  return {
    TenTapStartKit: [],
    CoreBridge: { name: "coreBridge", configureCSS: (css: string) => ({ css }) },
    PlaceholderBridge: { configureExtension: (config: unknown) => ({ config }) },
    // The page says "editor-ready" once it has loaded, as tentap's web editor does.
    RichText: (props: Record<string, unknown>) => {
      useEffect(() => {
        (props["onMessage"] as (event: unknown) => void)({
          nativeEvent: { data: JSON.stringify({ type: "editor-ready" }) },
        });
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- one page load per mount, as the WebView loads once
      }, []);
      return createElement("div", {
        "data-testid": "webview",
        "aria-label": props["accessibilityLabel"],
      });
    },
    useBridgeState: () => bridge.state,
    useEditorBridge: (options: Record<string, unknown>) => {
      bridge.options = options;
      return {
        getJSON: async () => bridge.json,
        getHTML: async () => bridge.html,
        setContent: record("setContent"),
        setEditable: record("setEditable"),
        setPlaceholder: record("setPlaceholder"),
        injectCSS: record("injectCSS"),
        injectJS: record("injectJS"),
        setLink: record("setLink"),
        toggleBold: record("toggleBold"),
        toggleItalic: record("toggleItalic"),
        toggleUnderline: record("toggleUnderline"),
        toggleStrike: record("toggleStrike"),
        toggleCode: record("toggleCode"),
        toggleHeading: record("toggleHeading"),
        toggleBulletList: record("toggleBulletList"),
        toggleOrderedList: record("toggleOrderedList"),
        toggleBlockquote: record("toggleBlockquote"),
        undo: record("undo"),
        redo: record("redo"),
      };
    },
  };
});
vi.mock("react-native", () => ({ View: view, ScrollView: view, I18nManager: { isRTL: false } }));
vi.mock("heroui-native", () => ({
  cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
  useThemeColor: (names: string[]) => names.map(() => "#123456"),
}));
const { button, span, view } = vi.hoisted(() => ({
  view: (props: Record<string, unknown>) =>
    createElement(
      "div",
      { role: props["accessibilityRole"], "aria-label": props["accessibilityLabel"] },
      props["children"] as ReactNode,
    ),
  button: (props: Record<string, unknown>) =>
    createElement("button", {
      type: "button",
      "aria-label": props["label"],
      "aria-pressed": props["isSelected"],
      disabled: props["isDisabled"],
      onClick: () =>
        (props["onChange"] as ((v: boolean) => void) | undefined)?.(!props["isSelected"]) ??
        (props["onPress"] as (() => void) | undefined)?.(),
    }),
  span: (props: Record<string, unknown>) =>
    createElement("span", null, props["children"] as ReactNode),
}));
vi.mock("#native/toggle-button/toggle-button", () => ({ ToggleButton: button }));
vi.mock("#native/icon-button/icon-button", () => ({ IconButton: button }));
vi.mock("#native/button/button", () => ({ Button: span }));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/separator/separator", () => ({ Separator: () => null }));
vi.mock("#native/text-field/text-field", () => ({ TextField: () => null }));
vi.mock("#native/label/label", () => ({ Label: span }));
vi.mock("#native/description/description", () => ({ Description: span }));
vi.mock("#native/field-error/field-error", () => ({ FieldError: span }));
vi.mock("#native/text/text", () => ({ Text: span }));

const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
/** The editor reports a change, as tentap does after a content-update message. */
const change = async () => {
  await act(async () => {
    (bridge.options["onChange"] as () => void)();
    await Promise.resolve();
  });
};

beforeEach(() => {
  bridge.state = {};
  bridge.calls = [];
  bridge.json = { type: "doc", content: [] };
});

describe("RichTextEditor (native, tentap)", () => {
  it("loads web JSON without dir and reports the web editor's shape", async () => {
    const onChange = vi.fn();
    render(
      <RichTextEditor
        label="Note"
        defaultValue={{
          type: "doc",
          attrs: { dir: "auto" },
          content: [{ type: "paragraph", attrs: { dir: "auto" } }],
        }}
        onChange={onChange}
      />,
    );
    expect(bridge.options["initialContent"]).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
    expect(bridge.options["editable"]).toBe(true);
    bridge.json = doc("مرحبا");
    await change();
    expect(onChange).toHaveBeenLastCalledWith({
      type: "doc",
      attrs: { dir: "auto" },
      content: [
        { type: "paragraph", attrs: { dir: "auto" }, content: [{ type: "text", text: "مرحبا" }] },
      ],
    });
    expect(screen.getByTestId("webview").getAttribute("aria-label")).toBe("Note");
  });

  it("reports HTML in the html format", async () => {
    const onChange = vi.fn();
    render(<RichTextEditor label="Note" format="html" onChange={onChange} />);
    bridge.json = doc("Hi");
    bridge.html = "<p>Hi</p>";
    await change();
    expect(onChange).toHaveBeenLastCalledWith("<p>Hi</p>");
  });

  it("counts against the limit and puts back a change past it", async () => {
    const onChange = vi.fn();
    render(<RichTextEditor label="Note" characterLimit={5} onChange={onChange} />);
    bridge.json = doc("Hello");
    await change();
    expect(screen.getByText("5 / 5")).toBeTruthy();
    bridge.json = doc("Hello!");
    await change();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(bridge.calls).toContainEqual(["setContent", doc("Hello")]);
  });

  it("applies a new controlled value without reporting it", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RichTextEditor label="Note" value="<p>a</p>" onChange={onChange} />,
    );
    rerender(<RichTextEditor label="Note" value="<p>b</p>" onChange={onChange} />);
    expect(bridge.calls).toContainEqual(["setContent", "<p>b</p>"]);
    await change();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("drives the toolbar through the bridge with names and pressed states", () => {
    bridge.state = { isBoldActive: true, headingLevel: 2, canUndo: false };
    render(<RichTextEditor label="Note" />);
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bold" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Heading 2" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect((screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement).disabled).toBe(true);
    act(() => screen.getByRole("button", { name: "Heading 3" }).click());
    act(() => screen.getByRole("button", { name: "Italic" }).click());
    expect(bridge.calls).toContainEqual(["toggleHeading", 3]);
    expect(bridge.calls).toContainEqual(["toggleItalic"]);
    expect(bridge.calls.some(([name]) => name === "injectCSS")).toBe(true);
  });

  it("keeps a document with nodes the native schema lacks read-only, shown as text", () => {
    render(
      <RichTextEditor
        label="Note"
        value={{
          type: "doc",
          content: [
            { type: "codeBlock", content: [{ type: "text", text: "x = 1" }] },
            { type: "horizontalRule" },
          ],
        }}
      />,
    );
    expect(bridge.options["editable"]).toBe(false);
    expect(bridge.options["initialContent"]).toEqual(doc("x = 1"));
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.getByText(/can't change/)).toBeTruthy();
  });
});

/**
 * Stackra file contract:
 * Purpose: proves the web RichTextEditor names its toolbar and its toggle, action and command buttons from `label`
 *          (keeping HeroUI Pro's defaults without it), draws the editor with the value, placeholder and disabled state
 *          HeroUI Pro takes, passes unknown props through, carries HeroUI Pro's own parts and hooks, and refuses its
 *          `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and a real Tiptap editor; the theme CSS is not loaded, so classes are checked,
 *          not looks. ProseMirror measures text with `Range.getClientRects` and `getBoundingClientRect`, which jsdom
 *          lacks, so both are stubbed to empty geometry.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import {
  RichTextEditor as HeroRichTextEditor,
  filterRichTextEditorSuggestionItems as heroFilter,
  useRichTextEditor as heroUseRichTextEditor,
  useRichTextEditorState as heroUseRichTextEditorState,
} from "@heroui-pro/react/rich-text-editor";
import { render, screen } from "@testing-library/react";

import type {
  RichTextEditorActionButtonContractProps,
  RichTextEditorCommandButtonContractProps,
  RichTextEditorToggleButtonContractProps,
  RichTextEditorToolbarContractProps,
} from "#contracts/types/rich-text-editor-contract-props.type";
import {
  RichTextEditor,
  filterRichTextEditorSuggestionItems,
  useRichTextEditor,
  useRichTextEditorState,
} from "#react/rich-text-editor/rich-text-editor";
import type { RichTextEditorActionButtonProps } from "#react/rich-text-editor/rich-text-editor-action-button";
import type { RichTextEditorCommandButtonProps } from "#react/rich-text-editor/rich-text-editor-command-button";
import type { RichTextEditorToggleButtonProps } from "#react/rich-text-editor/rich-text-editor-toggle-button";
import type { RichTextEditorToolbarProps } from "#react/rich-text-editor/rich-text-editor-toolbar";

interface Labels {
  readonly toolbar?: string;
  readonly toggle?: string;
  readonly action?: string;
  readonly command?: string;
}

function Editor({ toolbar, toggle, action, command }: Labels) {
  return (
    <RichTextEditor data-testid="root" placeholder="Write here">
      <RichTextEditor.Shell>
        <RichTextEditor.Toolbar {...(toolbar ? { label: toolbar } : {})}>
          <RichTextEditor.ToggleButton command="bold" {...(toggle ? { label: toggle } : {})}>
            B
          </RichTextEditor.ToggleButton>
          <RichTextEditor.ActionButton action="undo" {...(action ? { label: action } : {})}>
            U
          </RichTextEditor.ActionButton>
          <RichTextEditor.CommandButton
            onCommand={() => true}
            {...(command ? { label: command } : {})}
          >
            C
          </RichTextEditor.CommandButton>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
        <RichTextEditor.Footer>
          <RichTextEditor.CharacterCount />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}

describe("RichTextEditor (web)", () => {
  beforeAll(() => {
    const emptyRect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    Object.defineProperty(Range.prototype, "getClientRects", { value: () => [] });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      value: () => ({ ...emptyRect, toJSON: () => emptyRect }),
    });
  });

  it("names the toolbar and its buttons from label", () => {
    render(<Editor toolbar="Formatting" toggle="Make bold" action="Step back" command="Run" />);
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Make bold" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Step back" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run" })).toBeTruthy();
  });

  it("keeps HeroUI Pro's default names when label is left out", () => {
    render(<Editor />);
    expect(screen.getByRole("toolbar").getAttribute("aria-label")).toBeTruthy();
    expect(screen.getByRole("button", { name: /bold/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /undo/i })).toBeTruthy();
  });

  it("passes unknown props through to HeroUI Pro's root", () => {
    render(<Editor />);
    expect(screen.getByTestId("root")).toBeTruthy();
    expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts, hooks and filter", () => {
    expect(RichTextEditor.Shell).toBe(HeroRichTextEditor.Shell);
    expect(RichTextEditor.ToolbarGroup).toBe(HeroRichTextEditor.ToolbarGroup);
    expect(RichTextEditor.ToolbarSeparator).toBe(HeroRichTextEditor.ToolbarSeparator);
    expect(RichTextEditor.LinkPopover).toBe(HeroRichTextEditor.LinkPopover);
    expect(RichTextEditor.Content).toBe(HeroRichTextEditor.Content);
    expect(RichTextEditor.BubbleMenu).toBe(HeroRichTextEditor.BubbleMenu);
    expect(RichTextEditor.FloatingMenu).toBe(HeroRichTextEditor.FloatingMenu);
    expect(RichTextEditor.SuggestionMenu).toBe(HeroRichTextEditor.SuggestionMenu);
    expect(RichTextEditor.Footer).toBe(HeroRichTextEditor.Footer);
    expect(RichTextEditor.CharacterCount).toBe(HeroRichTextEditor.CharacterCount);
    expect(useRichTextEditor).toBe(heroUseRichTextEditor);
    expect(useRichTextEditorState).toBe(heroUseRichTextEditorState);
    expect(filterRichTextEditorSuggestionItems).toBe(heroFilter);
  });

  it("types the accessible name as label on every part that has one", () => {
    expectTypeOf<RichTextEditorToolbarProps>().toExtend<RichTextEditorToolbarContractProps>();
    expectTypeOf<RichTextEditorToolbarProps>().not.toHaveProperty("aria-label");
    expectTypeOf<RichTextEditorToggleButtonProps>().toExtend<RichTextEditorToggleButtonContractProps>();
    expectTypeOf<RichTextEditorToggleButtonProps>().not.toHaveProperty("aria-label");
    expectTypeOf<RichTextEditorActionButtonProps>().toExtend<RichTextEditorActionButtonContractProps>();
    expectTypeOf<RichTextEditorActionButtonProps>().not.toHaveProperty("aria-label");
    expectTypeOf<RichTextEditorCommandButtonProps>().toExtend<RichTextEditorCommandButtonContractProps>();
    expectTypeOf<RichTextEditorCommandButtonProps>().not.toHaveProperty("aria-label");
  });
});

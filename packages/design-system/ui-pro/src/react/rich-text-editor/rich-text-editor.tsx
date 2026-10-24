/**
 * Stackra file contract:
 * Purpose: the web `RichTextEditor` compound on HeroUI Pro's RichTextEditor (a composable Tiptap editor): the root and
 *          most parts are HeroUI Pro's own; the toolbar and its three kinds of button map `label` to `aria-label`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `RichTextEditor.Root` is left out. HeroUI Pro's hooks and the suggestion
 *          filter are re-exported as they are. Imports the `rich-text-editor` subpath, the only way to reach it (it
 *          needs the optional `@tiptap/*` peers).
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  type RichTextEditorProps as HeroRichTextEditorProps,
} from "@heroui-pro/react/rich-text-editor";

import { RichTextEditorActionButton } from "#react/rich-text-editor/rich-text-editor-action-button";
import { RichTextEditorCommandButton } from "#react/rich-text-editor/rich-text-editor-command-button";
import { RichTextEditorToggleButton } from "#react/rich-text-editor/rich-text-editor-toggle-button";
import { RichTextEditorToolbar } from "#react/rich-text-editor/rich-text-editor-toolbar";

export {
  filterRichTextEditorSuggestionItems,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react/rich-text-editor";

/** Props of the web RichTextEditor: HeroUI Pro's own, whose `isDisabled` already has the Stackra name. */
export type RichTextEditorProps = HeroRichTextEditorProps;

/** The root: HeroUI Pro's, which owns the Tiptap editor and its value. */
function RichTextEditorRoot(props: RichTextEditorProps) {
  return <HeroRichTextEditor.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface RichTextEditorParts {
  /** The frame that holds the toolbar, the content and the footer. */
  readonly Shell: typeof HeroRichTextEditor.Shell;
  /** The toolbar that holds the controls; named by `label`. */
  readonly Toolbar: typeof RichTextEditorToolbar;
  /** A labelled group of toolbar controls. */
  readonly ToolbarGroup: typeof HeroRichTextEditor.ToolbarGroup;
  /** A divider between toolbar groups. */
  readonly ToolbarSeparator: typeof HeroRichTextEditor.ToolbarSeparator;
  /** A button that toggles a format on the selection; named by `label`. */
  readonly ToggleButton: typeof RichTextEditorToggleButton;
  /** A button that runs an editor action such as undo; named by `label`. */
  readonly ActionButton: typeof RichTextEditorActionButton;
  /** A button that runs your own Tiptap command; named by `label`. */
  readonly CommandButton: typeof RichTextEditorCommandButton;
  /** The link control: a popover with a trigger, an input and apply and unset buttons. */
  readonly LinkPopover: typeof HeroRichTextEditor.LinkPopover;
  /** The editable area. */
  readonly Content: typeof HeroRichTextEditor.Content;
  /** A toolbar that appears over the selection. */
  readonly BubbleMenu: typeof HeroRichTextEditor.BubbleMenu;
  /** A toolbar that appears on an empty line. */
  readonly FloatingMenu: typeof HeroRichTextEditor.FloatingMenu;
  /** A menu of items that opens on a trigger character such as a slash. */
  readonly SuggestionMenu: typeof HeroRichTextEditor.SuggestionMenu;
  /** The footer under the content. */
  readonly Footer: typeof HeroRichTextEditor.Footer;
  /** The character and word count. */
  readonly CharacterCount: typeof HeroRichTextEditor.CharacterCount;
}

/**
 * A composable Tiptap editor: `RichTextEditor.Shell` holds `RichTextEditor.Toolbar`, `RichTextEditor.Content` and
 * `RichTextEditor.Footer`. Its value is Tiptap JSON.
 */
export const RichTextEditor: typeof RichTextEditorRoot & RichTextEditorParts = Object.assign(
  RichTextEditorRoot,
  {
    Shell: HeroRichTextEditor.Shell,
    Toolbar: RichTextEditorToolbar,
    ToolbarGroup: HeroRichTextEditor.ToolbarGroup,
    ToolbarSeparator: HeroRichTextEditor.ToolbarSeparator,
    ToggleButton: RichTextEditorToggleButton,
    ActionButton: RichTextEditorActionButton,
    CommandButton: RichTextEditorCommandButton,
    LinkPopover: HeroRichTextEditor.LinkPopover,
    Content: HeroRichTextEditor.Content,
    BubbleMenu: HeroRichTextEditor.BubbleMenu,
    FloatingMenu: HeroRichTextEditor.FloatingMenu,
    SuggestionMenu: HeroRichTextEditor.SuggestionMenu,
    Footer: HeroRichTextEditor.Footer,
    CharacterCount: HeroRichTextEditor.CharacterCount,
  },
);

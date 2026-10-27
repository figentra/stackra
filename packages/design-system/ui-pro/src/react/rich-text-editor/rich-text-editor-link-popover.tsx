/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.LinkPopover` on HeroUI Pro's link popover: the root and the parts Content, Input, Actions,
 *          ApplyButton and UnsetButton are HeroUI Pro's own; Trigger is the wrapper's, one HeroUI button named by
 *          `label`. HeroUI Pro's trigger puts its button inside HeroUI's `Popover.Trigger`, a second element with the
 *          button role, so the toolbar holds a button inside a button with two tab stops. The wrapper's trigger is the
 *          button alone, which takes the popover's trigger props from React Aria as the popover's first child.
 * Boundary: the trigger keeps HeroUI Pro's look (its classes and `data-slot`), its name (the catalogue's `ui_pro::rich_text_editor.link`, "Link" in English) and its rule for when it
 *          is disabled (no editor, or a disabled or read-only one); HeroUI Pro's `tooltip` on it is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  richTextEditorVariants,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react/rich-text-editor";
import { Button } from "@heroui/react";
import type { ComponentProps } from "react";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { RichTextEditorLinkPopoverTriggerProps } from "#react/rich-text-editor/rich-text-editor-link-popover-trigger.props";

/** The trigger: the toolbar button that opens the link popover, marked while the selection is a link. */
function RichTextEditorLinkPopoverTrigger({
  label,
  children,
  className,
  isDisabled,
  isIconOnly = true,
  size = "sm",
  variant = "ghost",
  ...rest
}: RichTextEditorLinkPopoverTriggerProps) {
  const t = useUiProText();
  const name = label ?? t(UI_PRO_KEYS.ui_pro.rich_text_editor.link);
  const { editor, isDisabled: isEditorDisabled, isReadOnly } = useRichTextEditor();
  const isLink =
    useRichTextEditorState(({ editor: current }) => Boolean(current) && current.isActive("link")) ??
    false;
  const slots = richTextEditorVariants();
  return (
    <Button
      {...rest}
      aria-label={name}
      className={[slots.toolbarButton(), slots.linkPopoverTrigger(), className]
        .filter(Boolean)
        .join(" ")}
      data-active={isLink || undefined}
      data-slot="rich-text-editor-link-popover-trigger"
      isDisabled={!editor || isEditorDisabled || isReadOnly || Boolean(isDisabled)}
      isIconOnly={isIconOnly}
      size={size}
      variant={variant}
    >
      {children ?? name}
    </Button>
  );
}

/** HeroUI Pro's link popover root, under the wrapper's own name so its parts can differ from HeroUI Pro's object. */
function RichTextEditorLinkPopoverRoot(
  props: ComponentProps<typeof HeroRichTextEditor.LinkPopover>,
) {
  return <HeroRichTextEditor.LinkPopover {...props} />;
}

/** The parts of the link popover, typed from HeroUI Pro's own so the declaration output can name them. */
interface RichTextEditorLinkPopoverParts {
  /** The toolbar button that opens the popover; named by `label`. */
  readonly Trigger: typeof RichTextEditorLinkPopoverTrigger;
  /** The popover. */
  readonly Content: typeof HeroRichTextEditor.LinkPopover.Content;
  /** The URL field. */
  readonly Input: typeof HeroRichTextEditor.LinkPopover.Input;
  /** The row of buttons under the field. */
  readonly Actions: typeof HeroRichTextEditor.LinkPopover.Actions;
  /** The button that sets the link. */
  readonly ApplyButton: typeof HeroRichTextEditor.LinkPopover.ApplyButton;
  /** The button that removes the link. */
  readonly UnsetButton: typeof HeroRichTextEditor.LinkPopover.UnsetButton;
}

/** The link control: `LinkPopover.Trigger`, then `LinkPopover.Content` with the input and the actions. */
export const RichTextEditorLinkPopover: typeof RichTextEditorLinkPopoverRoot &
  RichTextEditorLinkPopoverParts = Object.assign(RichTextEditorLinkPopoverRoot, {
  Trigger: RichTextEditorLinkPopoverTrigger,
  Content: HeroRichTextEditor.LinkPopover.Content,
  Input: HeroRichTextEditor.LinkPopover.Input,
  Actions: HeroRichTextEditor.LinkPopover.Actions,
  ApplyButton: HeroRichTextEditor.LinkPopover.ApplyButton,
  UnsetButton: HeroRichTextEditor.LinkPopover.UnsetButton,
});

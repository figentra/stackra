/**
 * Stackra file contract:
 * Purpose: the web `FloatingTableOfContents` compound on HeroUI Pro's FloatingToc (the name spelt out: abbreviations
 *          are banned): the root maps `isOpen` to HeroUI Pro's `open`, `Trigger` takes the `label` its bars lack (`ui_pro::table_of_contents.on_this_page` by default),
 *          `Bar` and `Item` map `isActive` to HeroUI Pro's `active`, and Content is HeroUI Pro's own. Part names are
 *          HeroUI Pro's.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `FloatingToc.Root` is left out. Imports the `floating-toc` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no abbreviations); STA-416 FR-004.
 */
import { FloatingToc as HeroFloatingToc } from "@heroui-pro/react/floating-toc";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { FloatingTableOfContentsProps } from "#react/floating-table-of-contents/floating-table-of-contents.props";
import type { FloatingTableOfContentsTriggerProps } from "#react/floating-table-of-contents/floating-table-of-contents-trigger.props";
import type { FloatingTableOfContentsBarProps } from "#react/floating-table-of-contents/floating-table-of-contents-bar.props";
import type { FloatingTableOfContentsItemProps } from "#react/floating-table-of-contents/floating-table-of-contents-item.props";

/** The root: HeroUI Pro's, which holds the open state, the side and the trigger mode. */
function FloatingTableOfContentsRoot({ isOpen, ...rest }: FloatingTableOfContentsProps) {
  return <HeroFloatingToc.Root {...rest} {...omitUndefined({ open: isOpen })} />;
}

/** The trigger that holds the bars, named by `label` or the catalogue's "On this page". */
function FloatingTableOfContentsTrigger({ label, ...rest }: FloatingTableOfContentsTriggerProps) {
  const t = useUiProText();
  return (
    <HeroFloatingToc.Trigger
      {...rest}
      aria-label={label ?? t(UI_PRO_KEYS.ui_pro.table_of_contents.on_this_page)}
    />
  );
}

/** One bar of the trigger, a section mark; the current section's is highlighted by `isActive`. */
function FloatingTableOfContentsBar({ isActive, ...rest }: FloatingTableOfContentsBarProps) {
  return <HeroFloatingToc.Bar {...rest} {...omitUndefined({ active: isActive })} />;
}

/** One entry of the content, a section link; the current section's is highlighted by `isActive`. */
function FloatingTableOfContentsItem({ isActive, ...rest }: FloatingTableOfContentsItemProps) {
  return <HeroFloatingToc.Item {...rest} {...omitUndefined({ active: isActive })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface FloatingTableOfContentsParts {
  /** The element that holds the bars and opens the content, named by `label`. */
  readonly Trigger: typeof FloatingTableOfContentsTrigger;
  /** One bar inside the trigger, a mark for a section. */
  readonly Bar: typeof FloatingTableOfContentsBar;
  /** The popover that holds the items. */
  readonly Content: typeof HeroFloatingToc.Content;
  /** One entry of the content, a link to a section. */
  readonly Item: typeof FloatingTableOfContentsItem;
}

/**
 * A table of contents that floats at the page edge: `FloatingTableOfContents.Trigger` holds a `Bar` per section and
 * opens `FloatingTableOfContents.Content` of `Item` links. Name the trigger for screen readers with `label`.
 */
export const FloatingTableOfContents: typeof FloatingTableOfContentsRoot &
  FloatingTableOfContentsParts = Object.assign(FloatingTableOfContentsRoot, {
  Trigger: FloatingTableOfContentsTrigger,
  Bar: FloatingTableOfContentsBar,
  Content: HeroFloatingToc.Content,
  Item: FloatingTableOfContentsItem,
});

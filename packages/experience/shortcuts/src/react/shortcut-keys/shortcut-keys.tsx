/**
 * Stackra file contract:
 * Purpose: `ShortcutKeys`, the one key hint of the apps: it draws a binding with the platform's modifiers (`⌘K` on
 *          Apple devices, `Ctrl+K` elsewhere), one inner `<kbd>` per chord step separated by a space, and gives screen
 *          readers the spoken form (`Command K`) as the outer element's image label.
 * Boundary: presentation only; nested `<kbd>` elements as HTML specifies for key input, styled by the caller's
 *           `className`. The server renders the non-Apple form and the client switches after hydration without a
 *           mismatch (`useSyncExternalStore`'s server snapshot). Draws nothing for a shortcut with no binding.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 23); registry v3.1 R-66 (display is ours); the template's palette and shell.
 */
import { kindOf } from "@stackra/container";
import { Fragment, type ReactElement, useSyncExternalStore } from "react";

import { formatShortcutKeys } from "#core/functions/format-shortcut-keys.function";
import { isApplePlatform } from "#core/functions/is-apple-platform.function";
import type { ShortcutKeysProps } from "#react/shortcut-keys/shortcut-keys.props";

/** The platform never changes while the page lives, so there is nothing to subscribe to. */
const subscribe = () => () => undefined;

/** The server snapshot: no navigator, so the non-Apple form. */
const onServer = () => false;

/**
 * The key hint of a binding or a shortcut class.
 *
 * @throws RangeError when `keys` is not a key binding.
 * @example
 * <ShortcutKeys shortcut={OpenPaletteShortcut} />
 * <ShortcutKeys keys={shortcut.keys} className="ms-auto" />
 */
export function ShortcutKeys(props: ShortcutKeysProps): ReactElement | null {
  const apple = useSyncExternalStore(subscribe, isApplePlatform, onServer);
  const keys =
    props.keys !== undefined
      ? props.keys
      : ((kindOf(props.shortcut)?.options["keys"] as string | null | undefined) ?? null);
  if (keys === null) return null;
  const display = formatShortcutKeys(keys, apple);
  return (
    // role="img": a generic element's aria-label is not announced; the hint is read as its spoken form
    <kbd className={props.className} role="img" aria-label={display.spoken}>
      {display.steps.map((step, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a chord's steps are positional and never reorder
        <Fragment key={index}>
          {index > 0 && " "}
          <kbd>{step}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}

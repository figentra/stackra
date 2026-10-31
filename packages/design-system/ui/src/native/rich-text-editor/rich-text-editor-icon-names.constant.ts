/**
 * Stackra file contract:
 * Purpose: `RICH_TEXT_EDITOR_ICON_NAMES`, the icon of each toolbar button of the native `RichTextEditor`.
 * Boundary: names only; each is in the native registry (`ui-icons.constant.ts`).
 * Runtime: react-native
 * Governing contract: owner decision R-56 and ADR 0322 (no raw icon literals); ADR 0466; STA-1371.
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each native RichTextEditor toolbar button. */
export const RICH_TEXT_EDITOR_ICON_NAMES = Object.freeze({
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strike: "strikethrough",
  code: "code",
  bullet: "list",
  ordered: "list-ordered",
  quote: "quote",
  link: "link",
  undo: "undo-2",
  redo: "redo-2",
} as const satisfies Readonly<Record<string, IconName>>);

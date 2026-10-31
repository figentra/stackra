/**
 * Stackra file contract:
 * Purpose: `RichTextToolbarItem`, one button a contribution adds to the web RichTextEditor's toolbar: an AI action, an
 *          insert or a toggle of a contributed mark.
 * Boundary: types only; the button runs against the TipTap `Editor`, so it is web-only (ADR 0466 decision 3).
 * Runtime: browser
 * Governing contract: ADR 0466 (decisions 3 and 4); ADR 0305 (one declaration per file); STA-1371.
 */
import type { Editor } from "@tiptap/core";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** A contributed toolbar button. */
export interface RichTextToolbarItem {
  /** A stable id, unique in the toolbar. */
  readonly id: string;
  /** The button's accessible name and tooltip. */
  readonly label: string;
  /** The icon the button shows. */
  readonly icon: IconSlot;
  /** Runs the button: apply a command, open a dialog, start an AI action as one undoable transaction. */
  readonly onPress: (editor: Editor) => void;
  /** Whether the button shows pressed, such as a contributed mark at the selection. Without it, it is a plain button. */
  readonly isActive?: ((editor: Editor) => boolean) | undefined;
  /** Whether the button is unavailable right now. */
  readonly isDisabled?: ((editor: Editor) => boolean) | undefined;
}

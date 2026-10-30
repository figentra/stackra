/**
 * Stackra file contract:
 * Purpose: `PopconfirmContractProps`, the props every runtime's `Popconfirm` takes: a small question anchored to the
 *          control that asks it ("Delete this draft?"), with an optional line of detail, a confirm and a cancel button,
 *          the confirm's tone, and what confirming and cancelling do. A confirm that returns a promise keeps the
 *          question open with the confirm button pending until it settles.
 * Boundary: types only. A decision that needs more room, a field or a list is an AlertDialog or a Modal.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA `alertdialog`; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactElement } from "react";

import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `Popconfirm`. */
export interface PopconfirmContractProps extends OpenStateContractProps, PlacementContractProps {
  /** The pressable that asks the question, usually a Button or IconButton with its own name. */
  readonly trigger: ReactElement;
  /** The question, worded as a decision ("Delete this draft?"); it names the popover. */
  readonly title: string;
  /** One line on what confirming does, read out with the question. */
  readonly description?: string | undefined;
  /** The confirm button's words, for example "Delete". Defaults to the catalogue's "Confirm". */
  readonly confirmLabel?: string | undefined;
  /** The cancel button's words. Defaults to the catalogue's "Cancel". */
  readonly cancelLabel?: string | undefined;
  /**
   * `danger` for a destructive confirm: the confirm button is red and focus starts on cancel. Defaults to `default`,
   * where focus starts on confirm.
   */
  readonly tone?: "default" | "danger" | undefined;
  /**
   * Called on confirm. Return a promise to keep the question open with the confirm button pending until it settles:
   * it closes when the promise resolves and stays open (to retry or cancel) when it rejects.
   */
  readonly onConfirm?: (() => unknown) | undefined;
  /** Called when the question is refused: the cancel button, Escape or a press outside. */
  readonly onCancel?: (() => void) | undefined;
}

/**
 * Stackra file contract:
 * Purpose: `ActionInputModalProps`, the props of the modal form a record or bulk action opens when its input needs more
 *          than the record id.
 * Boundary: props only; internal to the resource pages.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3).
 */
import type { ActionRef } from "@stackra/clients";

/** Props of `ActionInputModal`. */
export interface ActionInputModalProps {
  /** The resource key whose labels the title and fields take. */
  readonly resourceKey: string;

  /** The action the form submits. */
  readonly action: ActionRef;

  /** The input key the record id goes under; absent for an action without a record (List header, empty state). */
  readonly idKey?: string | undefined;

  /** The records the action runs on: one from a row or a View header, the selection from the bulk bar; absent, once. */
  readonly ids?: readonly string[] | undefined;

  /** The record a row or a View header pressed the button on; a form key it has a value for starts from that value. */
  readonly record?: object | undefined;

  /** Inputs filled in rather than asked for: a relation manager's bound parent id (`runId`). */
  readonly bound?: Readonly<Record<string, unknown>> | undefined;

  /** The input keys the form asks for (`actionFormKeys`). */
  readonly keys: readonly string[];

  /** Called when the modal closes: cancelled, dismissed or every record done. */
  readonly onClose: () => void;
}

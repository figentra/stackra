/**
 * Stackra file contract:
 * Purpose: `ActionInputModalProps`, the props of the native modal form an action opens when its input needs more than
 *          the record id.
 * Boundary: props only. The web modal's props (resource, action ref, records, bound inputs, the keys asked) plus the
 *           record's `isOpen` and `onOpenChange`; `keys` defaults to every input key but the id and the bound ones.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rule 3); ADR 0164 (native parity).
 */
import type { ActionRef } from "@stackra/clients";

/** Props of the native `ActionInputModal`. */
export interface ActionInputModalProps {
  /** The action whose input is asked: its ref, whose input schema validates the form. */
  readonly action: ActionRef;

  /** The resource key whose labels the title and fields take. */
  readonly resourceKey: string;

  /** Open; the modal is open when left out. Each opening starts a fresh form. */
  readonly isOpen?: boolean | undefined;

  /** Called with `false` when the modal closes: cancelled, dismissed or every record done. */
  readonly onOpenChange?: ((isOpen: boolean) => void) | undefined;

  /** The input key the record id goes under; absent for an action without a record (List header, empty state). */
  readonly idKey?: string | undefined;

  /** The records the action runs on: one from a row or a View header, the selection from the bulk bar; absent, once. */
  readonly ids?: readonly string[] | undefined;

  /** The record a row or a View header pressed the button on; a form key it has a value for starts from that value. */
  readonly record?: object | undefined;

  /** Inputs filled in rather than asked for (a parent id); never drawn. */
  readonly bound?: Readonly<Record<string, unknown>> | undefined;

  /** The input keys the form asks for; every input key but `idKey` and the bound ones when left out. */
  readonly keys?: readonly string[] | undefined;
}

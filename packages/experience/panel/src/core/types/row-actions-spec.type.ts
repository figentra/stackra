/**
 * Stackra file contract:
 * Purpose: `RowActionsSpec`, the server-driven shape of a row's actions menu: the actions, their menu sections, the
 *          trigger's accessible name, icon, variant and size, and whether the icon actions show as buttons on hover.
 * Boundary: a type only; data. A section lists its actions by their `action` key (or a derived action's id: `view`,
 *           `edit`, `delete`). A resource table's `rowActions` carries every field but `actions`, which are the actions
 *           placed at `ActionPlace.Row`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3); ADR 0504; the SDUI catalogue case `rowActions` (STA-1981).
 */
import type { ButtonVariant, IconSlot, Size } from "@stackra/ui/contracts";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/** A row's actions menu, as data. */
export interface RowActionsSpec {
  /** The actions of the row. */
  readonly actions: readonly ActionButtonSpec[];
  /** The actions grouped into menu sections, each listing action keys; absent, one section holds them all. */
  readonly sections?:
    | readonly {
        /** The section's title. */
        readonly label?: string | undefined;
        /** The action keys in the section, in order. */
        readonly actions: readonly string[];
      }[]
    | undefined;
  /** The accessible name of the trigger, for example "Actions for order 1001". */
  readonly label: string;
  /** The trigger's icon. Defaults to `ellipsis`. */
  readonly icon?: IconSlot | undefined;
  /** The trigger's emphasis. Defaults to `ghost`. */
  readonly variant?: ButtonVariant | undefined;
  /** The trigger's size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to draw the actions that have an icon as buttons revealed on hover or keyboard focus. */
  readonly hasHoverActions?: boolean | undefined;
}

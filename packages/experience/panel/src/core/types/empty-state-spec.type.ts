/**
 * Stackra file contract:
 * Purpose: `EmptyStateSpec`, the server-driven shape of an empty list: the title, the description, the icon (or none),
 *          the reason, the heading level, the buttons, and what shows when filters hide every row.
 * Boundary: a type only; data. A resource table's `empty` carries every field but `actions`, which are the actions
 *           placed at `ActionPlace.Empty`, and its title defaults to the resource's. Text fields are words or i18n keys,
 *           which the renderer translates.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3); ADR 0504; the SDUI catalogue case `emptyStates` (STA-1981).
 */
import type { EmptyReason, HeadingLevel, IconSlot } from "@stackra/ui/contracts";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/** An empty list, as data. */
export interface EmptyStateSpec {
  /** What is the matter, in a few words; the heading a screen reader jumps to. */
  readonly title: string;
  /** One or two sentences: why it is so, and what to do next. */
  readonly description?: string | undefined;
  /** An icon in place of the reason's own, or `false` for none. */
  readonly icon?: IconSlot | false | undefined;
  /** Why nothing is shown. Defaults to `no-data`. */
  readonly reason?: EmptyReason | undefined;
  /** The title's place in the document outline. Defaults to 2. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** The buttons, with their variant, size and icons. */
  readonly actions?: readonly ActionButtonSpec[] | undefined;
  /** What shows when filters hide every row (the table's filtered empty state). */
  readonly filtered?:
    | {
        /** Its title. */
        readonly title: string;
        /** Its description. */
        readonly description?: string | undefined;
      }
    | undefined;
}

/**
 * Stackra file contract:
 * Purpose: `ActionButtonSpec`, the server-driven shape of one action button: the action it runs, where it shows, the
 *          look `@stackra/ui`'s `Button` takes (icons, variant, size, full width, shortcut), why it is disabled, the line
 *          a menu shows under it, its tone, a link instead of a run, the permission that shows it, the confirmation
 *          it asks and the record predicate that hides it.
 * Boundary: a type only; data. A placed button (`PlacementNode`) carries every field but `action` and `place`, which
 *           its class and places already say. Text fields are words or i18n keys, which the renderer translates.
 *           `visibleWhen` names a boolean path of the record (`isCancellable`); the button hides while it is not true.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139 (confirmation); ADR 0508 (shortcuts); ADR 0504; the SDUI
 *                     catalogue case `actionButton` (STA-1981).
 */
import type { ButtonVariant, IconSlot, Size } from "@stackra/ui/contracts";

import type { ActionPlace } from "#core/enums/action-place.enum";

/** One action button, as data. */
export interface ActionButtonSpec {
  /** The versioned key of the action the button runs (`orders.order.cancel@1`, ADR 0164). */
  readonly action: string;
  /** Where it shows. */
  readonly place?: ActionPlace | undefined;
  /** The accessible name when it must differ from the visible label; in a menu, the item's text. */
  readonly label?: string | undefined;
  /** An icon drawn before the label, on the inline-start side. */
  readonly startIcon?: IconSlot | undefined;
  /** An icon drawn after the label, on the inline-end side. */
  readonly endIcon?: IconSlot | undefined;
  /** The emphasis and colour of the button. Defaults to `primary` (`danger` for a danger tone). */
  readonly variant?: ButtonVariant | undefined;
  /** The height, padding and text size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse presses and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
  /** True while the action runs elsewhere: presses are refused and a spinner shows. */
  readonly isLoading?: boolean | undefined;
  /** True to stretch the button to the full width of its container. */
  readonly isFullWidth?: boolean | undefined;
  /** The key binding that runs the action (`mod+s`, `g o`), ADR 0508. */
  readonly shortcut?: string | undefined;
  /** A stable id for the binding (`orders.create`), which a person's remap keys on. Defaults to `keys:<binding>`. */
  readonly shortcutId?: string | undefined;
  /** Why it is disabled; shown as the tooltip and read by assistive technology. */
  readonly disabledReason?: string | undefined;
  /** One line under the label in menus; a tooltip on a button. */
  readonly description?: string | undefined;
  /** `danger` for a destructive action. Defaults to `default`. */
  readonly tone?: "default" | "danger" | undefined;
  /** A link instead of a run (a navigation action): an app path or an absolute URL. */
  readonly href?: string | undefined;
  /** The permission key that shows the button; it is hidden while the signed-in principal lacks it. */
  readonly permission?: string | undefined;
  /** Asked before the run, in place of the action's declared confirmation. */
  readonly confirm?:
    | {
        /** The dialog's title. */
        readonly title: string;
        /** What the run will do. */
        readonly description?: string | undefined;
        /** `danger` for a destructive run. */
        readonly tone?: "danger" | undefined;
      }
    | undefined;
  /** The record path of a boolean; the button hides while it is not true. */
  readonly visibleWhen?: string | undefined;
}

/**
 * Stackra file contract:
 * Purpose: `QuickCreateProps`, what `QuickCreate` takes: the trigger's accessible name, icon, variant and size.
 * Boundary: a type only, in its own file beside the component. Every prop is optional; the entries come from the
 *           registered resources.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12: `<name>.props.ts`); ADR 0307 (rule 21: quick create is opt-in).
 */
import type { ButtonVariant, IconSlot, Size } from "@stackra/ui/contracts";

/** The props of the quick-create menu. */
export interface QuickCreateProps {
  /** The trigger's accessible name. Defaults to the panel's "New". */
  readonly label?: string | undefined;

  /** The trigger's icon. Defaults to `plus`. */
  readonly icon?: IconSlot | undefined;

  /** The trigger's emphasis. Defaults to `secondary`. */
  readonly variant?: ButtonVariant | undefined;

  /** The trigger's size. Defaults to `md`. */
  readonly size?: Size | undefined;
}

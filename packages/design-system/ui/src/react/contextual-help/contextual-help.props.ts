/**
 * Stackra file contract:
 * Purpose: `ContextualHelpProps`, the props of the web `ContextualHelp` in `contextual-help.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { ContextualHelpContractProps } from "#contracts/types/contextual-help-contract-props.type";
import type { PopoverProps } from "#react/popover/popover.props";

/**
 * Props of the web ContextualHelp: the shared contract plus the Popover's own props (dismissal, the arrow, the
 * content's attributes), passed through. The trigger is the component's, so `trigger` is refused.
 */
export type ContextualHelpProps = ContextualHelpContractProps &
  Omit<PopoverProps, keyof ContextualHelpContractProps | "trigger">;

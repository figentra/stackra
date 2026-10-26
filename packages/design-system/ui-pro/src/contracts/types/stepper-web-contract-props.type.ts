/**
 * Stackra file contract:
 * Purpose: `StepperWebContractProps`, props of the web `Stepper` root: the shared ones and the size HeroUI Pro's web
 *          stepper takes.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004 and
 *                     FR-011.
 */
import type { Size } from "@stackra/ui/contracts";

import type { StepperContractProps } from "#contracts/types/stepper-contract-props.type";

/** Props of the web `Stepper` root: the shared ones and the size HeroUI Pro's web stepper takes. */
export interface StepperWebContractProps extends StepperContractProps {
  /** The size of the steps; HeroUI Pro's own default when left out. */
  readonly size?: Size | undefined;
}

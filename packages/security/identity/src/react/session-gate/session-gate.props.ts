/**
 * Stackra file contract:
 * Purpose: `SessionGateProps`, what a host hands the SessionGate: the content for a signed-in user, what a signed-out
 *          visitor sees or where they go, the assurance the content needs and what a user below it sees.
 * Boundary: an interface in its own file beside the component (ADR 0305). The session is the container's
 *           `SessionService`, never a prop; the gate only decides what shows, and every call is still checked by its
 *           producer.
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (decision 8); ADR 0207 (decision 1); ADR 0406; ADR 0305.
 */
import type { AssuranceLevel } from "@stackra/contracts";
import type { ReactNode } from "react";

/**
 * The gate's content, fallbacks and assurance.
 *
 * @example
 * <SessionGate fallback={<SignInCard />} assurance={AssuranceLevel.Aal2} stepUp={<StepUpPrompt />}>
 *   <Billing />
 * </SessionGate>
 */
export interface SessionGateProps {
  /** Content shown when the condition holds. */
  readonly children?: ReactNode;
  /** Shown to a signed-out visitor; nothing when left out. */
  readonly fallback?: ReactNode;
  /** The sign-in route a signed-out visitor is sent to instead of seeing `fallback`. */
  readonly redirectTo?: string | undefined;
  /** The level the session's last authentication must reach; left out, any signed-in session passes. */
  readonly assurance?: AssuranceLevel | undefined;
  /** Shown to a signed-in user below `assurance`, usually a StepUpDialog or a prompt to verify; nothing when left out. */
  readonly stepUp?: ReactNode;
}

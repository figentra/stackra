/**
 * Stackra file contract:
 * Purpose: `SessionGate`, the identity kit's gate: shows its children to a signed-in user whose last authentication
 *          reaches `assurance`, `stepUp` to one below it, and `fallback` (or a redirect to `redirectTo`) to a
 *          signed-out visitor.
 * Boundary: reads `useSession`; renders nothing while the session loads, so a server render never flashes either side.
 *           A revoked session counts as signed out. The level is the session user's `assurance`; a session that
 *           does not say reaches no level. It hides content only: the producer still checks the assurance and its age
 *           on every call (`requireAssurance`).
 * Runtime: isomorphic
 * Governing contract: ADR 0504 (module UI kits); ADR 0206 (decision 8); ADR 0207 (decision 1); ADR 0406.
 */
import { AssuranceLevel, Enum } from "@stackra/contracts";
import { type ReactElement, useEffect } from "react";

import { SessionStatus } from "#core/index";
import type { SessionGateProps } from "#react/session-gate/session-gate.props";
import { useSession } from "#react/session/use-session";

/** The levels, weakest first. */
const ORDER: readonly AssuranceLevel[] = Enum.values(AssuranceLevel);

/**
 * Shows its children to a signed-in user, at the assurance asked for.
 *
 * @example
 * <SessionGate redirectTo="/sign-in" assurance={AssuranceLevel.Aal2} stepUp={<VerifyPrompt />}>
 *   <ApiKeys />
 * </SessionGate>
 */
export function SessionGate({
  children,
  fallback,
  redirectTo,
  assurance,
  stepUp,
}: SessionGateProps): ReactElement | null {
  const session = useSession();
  const isSignedOut =
    session.status === SessionStatus.SignedOut || session.status === SessionStatus.Revoked;
  useEffect(() => {
    if (isSignedOut && redirectTo !== undefined) location.assign(redirectTo);
  }, [isSignedOut, redirectTo]);
  if (session.status === SessionStatus.Loading) return null;
  if (session.user === null) return redirectTo === undefined ? <>{fallback}</> : null;
  const level = session.user.assurance;
  const isEnough =
    assurance === undefined ||
    (level !== undefined && ORDER.indexOf(level) >= ORDER.indexOf(assurance));
  return <>{isEnough ? children : stepUp}</>;
}

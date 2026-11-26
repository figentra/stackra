/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react/session` entry of @stackra/identity, the session alone for React: `useSession`,
 *          `SessionGate` and their types, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Reaches no `@stackra/ui` and no UI library, so a lean app (the
 *           starter console) reads the session without the kit's blocks; `./react` re-exports the same names beside
 *           the blocks (STA-2832).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0206 (decision 8); ADR 0504 (module UI kits); STA-2832.
 */
export { SessionGate } from "#react/session-gate/session-gate";
export type { SessionGateProps } from "#react/session-gate/session-gate.props";
export type { SessionValue } from "#react/session/session-value.type";
export type { SignedInSession } from "#react/session/signed-in-session.type";
export { useSession } from "#react/session/use-session";

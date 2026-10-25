/**
 * Stackra file contract:
 * Purpose: `SessionStatus`, where a client's session stands: still being read, signed in, signed out, or revoked by the
 *          provider; what `useSession().status` and the generated navigation switch on.
 * Boundary: an `Enum.of` value plus the type of the same name. `revoked` is the signal of ADR 0338 decision 4: the
 *           device's session was refused (revoked from "Sessions", or past its lifetime), so the stores that hold
 *           offline data wipe themselves and the client locks until a new sign-in. Only `signed_in` carries a user.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8); ADR 0277 (decision 5); ADR 0338 (decision 4); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The session's states. */
export const SessionStatus = Enum.of({
  /** The stored session is still being read; nothing is decided yet (a server render stays here). */
  Loading: "loading",
  /** A user is signed in. */
  SignedIn: "signed_in",
  /** No one is signed in. */
  SignedOut: "signed_out",
  /** The provider refused the device's session; offline data is wiped and the client waits for a new sign-in. */
  Revoked: "revoked",
});

/** One of the codes above. */
export type SessionStatus = Enum.Value<typeof SessionStatus>;

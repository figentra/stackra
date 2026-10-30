/**
 * Stackra file contract:
 * Purpose: `SurfaceDescriptor`, what a surface says about itself when it opens a session: its id, its kind, the app
 *          member, its client tool table hash, the route and the user's locale.
 * Boundary: a type only. The id is the stream the run's `client_tool` parts go to (and only that one). Descriptive, not
 *           trusted for access: the tools offered are still filtered by the permissions the caller holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 3 and 4); STA-1631.
 */
import type { SurfaceKind } from "#contracts/enums/surface-kind.enum";

/** One surface of a session. */
export interface SurfaceDescriptor {
  /** The surface's id, which a client tool call is addressed to. */
  readonly id: string;

  /** What kind of surface it is. */
  readonly kind: SurfaceKind;

  /** The app member's key. */
  readonly app: string;

  /** The hash of the client tool table the surface holds. */
  readonly hash: string;

  /** The route the user is on. */
  readonly route: string;

  /** The user's locale. */
  readonly locale: string;
}

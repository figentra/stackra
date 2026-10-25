/**
 * Stackra file contract:
 * Purpose: `FakeSessionOptions`, what `fakeSession` takes: the status to start in, how many memberships the fake user
 *          has, and what `signIn` and `signOut` do instead of the real flow.
 * Boundary: a type only; test code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3: domain helpers in the owning package's ./testing).
 */
import type { SessionStatus } from "#core/index";

/** How a fake session starts. */
export interface FakeSessionOptions {
  /** The status to start in; signed out when left out. */
  readonly status?: SessionStatus;

  /** How many memberships the fake user has; one when left out. */
  readonly tenants?: number;

  /** What `signIn` does; signs the fake user in when left out. */
  readonly signIn?: () => Promise<void>;

  /** What `signOut` does; signs out when left out. */
  readonly signOut?: () => Promise<void>;
}

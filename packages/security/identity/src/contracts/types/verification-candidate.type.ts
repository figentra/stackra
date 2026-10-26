/**
 * Stackra file contract:
 * Purpose: `VerificationCandidate`, one provider to try for a check, as `ProviderResolver#candidates("verification",
 *          …)` of `@stackra/integrations` answers it: the provider code, the loaded Connection that verifies, and
 *          whether it is the caller's own or the platform's managed one.
 * Boundary: a type only, structurally the same as integrations' `ProviderCandidate<VerificationProvider>`, so this
 *           package needs no dependency on `@stackra/integrations`. The vendor Connection classes live in the OS
 *           integrations service (owner decision R3-8), never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decision 1, verification Note); ADR 0356 (decision 7); capability map M2.
 */
import type { Verification } from "#contracts/ports/verification.port";

/** What a verifying Connection does: the two calls of the `Verification` port. */
export type VerificationProvider = Pick<Verification, "supports" | "verify">;

/** One provider to try. */
export interface VerificationCandidate {
  /** The Integration's provider code (`wathq`, `didit`). */
  readonly provider: string;

  /** The Connection, loaded with its credentials. */
  readonly connection: VerificationProvider;

  /** The caller's own Connection or the platform's managed one. */
  readonly mode: "own" | "managed";
}

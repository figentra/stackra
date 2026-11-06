/**
 * Stackra file contract:
 * Purpose: `EncoreDeployTree`, a built Encore deploy tree: the deploy commit the push ships, the service member it
 *          packages, and the clean-up that removes its temporary checkout.
 * Boundary: type only; `encoreDeployTree` returns it and the `encore-cloud` provider pushes and disposes it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app), ADR 0289 (decision 5: Encore Cloud), STA-136.
 */

/** A built Encore deploy tree. */
export type EncoreDeployTree = {
  /** The deploy commit: the source commit plus the generated app, `encore.app` and the path map. */
  readonly sha: string;
  /** The service member the tree packages, relative to the repository (`services/billing`). */
  readonly member: string;
  /** Removes the temporary checkout; the deploy commit stays in the repository's object store. */
  readonly dispose: () => Promise<void>;
};

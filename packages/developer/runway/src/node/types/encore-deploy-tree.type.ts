/**
 * Stackra file contract:
 * Purpose: `EncoreDeployTree`, a built Encore deploy tree: the deploy commit the push ships, the service members it
 *          holds as one app, and the clean-up that removes its temporary checkout.
 * Boundary: type only; `encoreDeployTree` returns it and the `encore-cloud` provider pushes and disposes it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app), ADR 0289 (decision 5: Encore Cloud), STA-136,
 *                     STA-2194.
 */

/** A built Encore deploy tree. */
export type EncoreDeployTree = {
  /** The deploy commit: the source tree with the generated app, rewritten imports and `encore.app` at the root. */
  readonly sha: string;
  /** The service members the app holds, relative to the repository (`services/billing`, `services/usage`). */
  readonly members: readonly string[];
  /** Removes the temporary checkout; the deploy commit stays in the repository's object store. */
  readonly dispose: () => Promise<void>;
};

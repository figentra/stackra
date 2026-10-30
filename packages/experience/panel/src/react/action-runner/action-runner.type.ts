/**
 * Stackra file contract:
 * Purpose: `ActionRunner`, the function `useActionRunner()` returns: run any consumed action with its input, through its
 *          declared confirmation unless the caller's form already showed it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0139; ADR 0260 (decision 4).
 */
import type { ActionRef, RefInput, RefOutput } from "@stackra/clients";

import type { ActionRun } from "#react/action-runner/action-run.type";

/** Runs one action; `confirmed` skips the runner's dialog when the caller's own form was the confirmation. */
export type ActionRunner = <A extends ActionRef>(
  action: A,
  input: RefInput<A>,
  options?: { readonly confirmed?: boolean },
) => Promise<ActionRun<RefOutput<A>>>;

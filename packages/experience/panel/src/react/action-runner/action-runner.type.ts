/**
 * Stackra file contract:
 * Purpose: `ActionRunner`, the function `useActionRunner()` returns: run any consumed action with its input, through its
 *          declared confirmation.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0139; ADR 0260 (decision 4).
 */
import type { ActionRef, RefInput, RefOutput } from "@stackra/clients";

import type { ActionRun } from "#react/action-runner/action-run.type";

/** Runs one action. */
export type ActionRunner = <A extends ActionRef>(
  action: A,
  input: RefInput<A>,
) => Promise<ActionRun<RefOutput<A>>>;

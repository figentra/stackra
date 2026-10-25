/**
 * Stackra file contract:
 * Purpose: `PreconditionContext`, what a precondition's `check` receives: the call's context, never the input or a
 *          record, because a precondition answers whether the call may run now, whoever asks.
 * Boundary: a type only, the call context of `ExtensionContext` under the precondition's name, so a precondition cannot
 *           reach `authorize`, `afterCommit` or the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 23: Precondition, `check(ctx)`); ADR 0138 (as amended: the
 *                     precondition step after permission).
 */
import type { ExtensionContext } from "#core/types/extension-context.type";

/** The context a precondition checks. */
export type PreconditionContext = ExtensionContext;

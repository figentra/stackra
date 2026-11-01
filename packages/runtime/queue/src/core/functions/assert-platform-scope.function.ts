/**
 * Stackra file contract:
 * Purpose: `assertPlatformScope(scope)`, the push boundary's check that a job's `scope` is a platform `ScopeRef`: an
 *          object whose `id` is an `scp_` public id and whose `path` is an `ltree` path.
 * Boundary: pure and internal to this package. A `ScopeRef` is a plain structural type with no marker, so this checks
 *           the shape only and cannot tell a platform-built reference from a hand-built one of the same shape; that
 *           limit is closed at run time, where `CallIsolation` resolves the scope in the scope tree and refuses a node
 *           the tree does not show or shows at another path. It refuses what a client string, an array, a bare id or a
 *           raw header value would be. The `scp_` suffix is not length-checked, since test and memory ids are short.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (a job's scope is platform-written); ADR 0327 (decision 7); ADR 0495 (note of
 *                     2026-11-01).
 */
import type { ScopeRef } from "@stackra/contracts";

import { ScopeNotPlatformWrittenError } from "#core/errors/scope-not-platform-written.error";

/** An `scp_` public id. */
const SCOPE_ID = /^scp_[\w-]+$/;

/** An `ltree` path, as `@stackra/database` accepts one. */
const LTREE_PATH = /^[\w-]+(?:\.[\w-]+)*$/;

/**
 * Checks `scope`, when there is one.
 *
 * @param scope - the scope a job is queued in.
 * @param within - the scope the running call acts in, when it acts in one.
 * @throws ScopeNotPlatformWrittenError when `scope` is present and is not shaped like a `ScopeRef`, or lies outside
 *         `within`.
 * @example
 * assertPlatformScope(options.scope, callerScopeOf(storage));
 */
export function assertPlatformScope(
  scope: unknown,
  within?: ScopeRef,
): asserts scope is ScopeRef | undefined {
  if (scope === undefined) return;
  if (typeof scope !== "object" || scope === null || Array.isArray(scope))
    throw ScopeNotPlatformWrittenError.create();
  const { id, path } = scope as { readonly id?: unknown; readonly path?: unknown };
  if (
    typeof id !== "string" ||
    typeof path !== "string" ||
    !SCOPE_ID.test(id) ||
    !LTREE_PATH.test(path)
  )
    throw ScopeNotPlatformWrittenError.create();
  if (within !== undefined && path !== within.path && !path.startsWith(`${within.path}.`))
    throw ScopeNotPlatformWrittenError.create();
}

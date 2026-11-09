/**
 * Stackra file contract:
 * Purpose: `tokenExpression`, one constructor token as generated code writes it: the class (`Settings`), a per-model
 *          token (`repositoryOf(Order)`) or a named instance (`named(Mailer, "ops")`), each name taken through `use`, which
 *          records its import. The seed entry and the test setup write seeders' tokens with it.
 * Boundary: pure; `use` decides how a class is imported and named.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (constructor injection by type); ADR 0294 (decision 17); STA-1698.
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The container's `named(...)`, for a `Named<Port, "x">` token. */
const NAMED: ClassRef = { name: "named", from: "@stackra/container" };

/**
 * The expression of `dep`.
 *
 * @example
 * tokenExpression({ class: ORDER, of: REPOSITORY_OF }, use); // "repositoryOf(Order)"
 */
export function tokenExpression(dep: TokenRef, use: (target: ClassRef) => string): string {
  if (dep.of !== undefined) return `${use(dep.of)}(${use(dep.class)})`;
  const token = use(dep.class);
  return dep.named === undefined ? token : `${use(NAMED)}(${token}, ${JSON.stringify(dep.named)})`;
}

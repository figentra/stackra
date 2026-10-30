/**
 * Stackra file contract:
 * Purpose: `PolicyClass<M>`, the class the called form `Policy<M>({ permissions })` returns and a consumer's policy
 *          extends; an exported, nameable type so declaration emit never inlines the policy base (STA-1680).
 * Boundary: a type only; imports the `Policy` instance type from its base.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0132 (as amended by 0294).
 */
import type { Policy } from "#core/bases/policy.base";

/** The class the called form `Policy<M>({ ... })` returns, which a consumer's policy extends. */
export type PolicyClass<M extends object = object> = abstract new () => Policy<M>;

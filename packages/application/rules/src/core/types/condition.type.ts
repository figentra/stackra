/**
 * Stackra file contract:
 * Purpose: `Condition`, a rule's test as data: a tree of `all`, `any` and `not` nodes whose leaves test one registered
 *          field with one operator of its type against a value.
 * Boundary: a type only, and JSON as it is, so a user-written rule is stored, versioned and sent as it stands. It names
 *           registered fields and operators and nothing else: there is no expression, function or template (ADR 0331
 *           decision 10, ADR 0154). `Rules.check` refuses a tree that is not one; an empty `all` holds and an empty
 *           `any` does not. A leaf's `value` is left out for an operator that takes none.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2, 3 and 10); ADR 0227 (data that references registered code).
 */
import type { Json } from "@stackra/contracts";

import type { Operator } from "#contracts/index";

/**
 * A condition tree.
 *
 * @example
 * const vip: Condition = {
 *   all: [
 *     { field: "cart.total", operator: Operator.AtLeast, value: { minor: 10_000, currency: "USD" } },
 *     { not: { field: "customer.tags", operator: Operator.Includes, value: "blocked" } },
 *   ],
 * };
 */
export type Condition =
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition }
  | { readonly field: string; readonly operator: Operator; readonly value?: Json };

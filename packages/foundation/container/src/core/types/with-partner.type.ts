/**
 * Stackra file contract:
 * Purpose: `WithPartner<M, O, Hint>`, the options type of a called kind base that names its partner as a type
 *          argument (`Policy<Order>({ ... })`): the options when the partner is given, a readable hint when it is not.
 * Boundary: a type only. The partner type parameter defaults to `never`, which nothing in the options can infer, so a
 *           called form without its type argument fails with the hint instead of silently typing the partner as the
 *           constraint.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 5, 44 and 46); the STA-409 partner spike.
 */

/**
 * The options of a called partner kind, or `Hint` when the partner type argument was left out.
 *
 * @example
 * type PolicyKind = <M extends Model = never>(
 *   options: WithPartner<M, PolicyOptions, "Name the model as a type argument: Policy<Order>({ … })">,
 * ) => PolicyClass<M>;
 */
export type WithPartner<M, O, Hint extends string> = [M] extends [never] ? Hint : O;

/**
 * Stackra file contract:
 * Purpose: `Assert<T>`, which fails the type check at its use site unless `T` is `true`: a generated `X$Check` proves
 *          the shape compiler right at no runtime cost.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `X$Check`); the STA-335 type-to-schema spike.
 */

/**
 * `T`, accepted only when it is `true`.
 *
 * @example
 * export type RequestedLine$Check = Assert<Same<z.output<typeof RequestedLine$>, Fields<RequestedLine>>>;
 */
export type Assert<T extends true> = T;

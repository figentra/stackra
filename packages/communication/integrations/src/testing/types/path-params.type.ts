/**
 * Stackra file contract:
 * Purpose: `PathParams<P>`, the parameters a fake route's path names (`"/emails/receiving/:id"` gives `{ id }`), as its
 *          answer receives them.
 * Boundary: a type only, read from the path literal; a path without parameters gives an empty object.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: a package's fakes live in its `./testing`).
 */

/**
 * The `:name` parameters of path `P`.
 *
 * @example
 * type P = PathParams<"/orders/:orderId/lines/:lineId">; // { orderId: string } & { lineId: string }
 */
export type PathParams<P extends string> = P extends `${string}:${infer Name}/${infer Rest}`
  ? { readonly [K in Name]: string } & PathParams<Rest>
  : P extends `${string}:${infer Name}`
    ? { readonly [K in Name]: string }
    : Readonly<Record<never, string>>;

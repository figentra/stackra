/**
 * Stackra file contract:
 * Purpose: `fillPath(pattern, params)`, a route's path with its params put in: `"/store/:slug"` with `{ slug: "tee" }`
 *          is `/store/tee`; a splat `*` takes `params["*"]` as it is (its slashes kept), so `"*"` with `"help"` is
 *          `/help`.
 * Boundary: internal. A named param is URI-encoded; each segment of a splat is encoded on its own. An optional param
 *           (`:id?`) that is missing drops its segment; a missing required one throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16).
 */

/** A path param's value as text, or `undefined`. */
const textOf = (value: unknown): string | undefined =>
  typeof value === "string" || typeof value === "number" || typeof value === "bigint"
    ? String(value)
    : undefined;

/**
 * `pattern` with `params` filled in, always absolute.
 *
 * @throws RangeError when a required param is missing.
 * @example
 * fillPath("/orders/:orderId", { orderId: "ord_1" }); // "/orders/ord_1"
 */
export function fillPath(pattern: string, params: Readonly<Record<string, unknown>> = {}): string {
  const segments: string[] = [];
  for (const segment of pattern.split("/")) {
    if (segment === "") continue;
    if (segment === "*") {
      const rest = textOf(params["*"]) ?? "";
      segments.push(
        ...rest
          .split("/")
          .filter((part) => part !== "")
          .map((part) => encodeURIComponent(part)),
      );
      continue;
    }
    if (!segment.startsWith(":")) {
      segments.push(segment);
      continue;
    }
    const isOptional = segment.endsWith("?");
    const name = segment.slice(1, isOptional ? -1 : undefined);
    const value = textOf(params[name]);
    if (value === undefined) {
      if (isOptional) continue;
      throw new RangeError(`The path "${pattern}" needs the param "${name}"`);
    }
    segments.push(encodeURIComponent(value));
  }
  return `/${segments.join("/")}`;
}

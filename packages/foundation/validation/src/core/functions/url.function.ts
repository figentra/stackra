/**
 * Stackra file contract:
 * Purpose: `url()`, the schema generated code writes for a field typed `Url`: an absolute URL with a `scheme://`
 *          (`https://…`, `wss://…`, an app scheme such as `acme://`), with the output typed `Url` so `X$Check` holds.
 * Boundary: zod's URL check (WHATWG parsing, surrounding whitespace trimmed) plus the `scheme://` the `Url` type
 *           promises, so `mailto:` and a relative path are refused. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler maps platform types).
 */
import type { Url } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

/** A scheme, `://` and at least one character of authority. */
const ABSOLUTE = /^[a-z][a-z\d+.-]*:\/\/[^/?#\s]/i;

/**
 * A new schema of absolute URLs.
 *
 * @example
 * export const EnvOptions$ = z.object({ apiOrigin: url() });
 */
export function url(): ZodType<Url, string> {
  return z
    .url()
    .refine(
      (value) => ABSOLUTE.test(value),
      "Expected an absolute URL with a scheme and an authority",
    ) as unknown as ZodType<Url, string>;
}

/**
 * Stackra file contract:
 * Purpose: `VAR_VALUE_SCHEMA`, one value of an app runway's `vars`: a literal, the string `from-port` (this member's
 *          own dev origin), a `ref:<output>` or `${pr}` value resolved at deploy, or a dev reference to another dev
 *          origin (`from-port: gateway`, `from-member: console`) with an optional scheme and path.
 * Boundary: internal; the shape only. `definesFor` resolves the references against the dev facts and the build
 *           environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0175 (domains), ADR 0231 (decision 4: public prefixes).
 */
import { z } from "zod";

/** The optional scheme and path a dev reference adds to the origin it names. */
const SHAPING = {
  scheme: z
    .string()
    .regex(/^[a-z][a-z0-9+.-]*$/, "Expected a URL scheme without `://`")
    .optional(),
  path: z.string().startsWith("/").optional(),
};

/** A literal, or a dev reference by port name or by member. */
export const VAR_VALUE_SCHEMA = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.strictObject({ "from-port": z.string().min(1), ...SHAPING }),
  z.strictObject({ "from-member": z.string().min(1), ...SHAPING }),
]);

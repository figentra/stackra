/**
 * Stackra file contract:
 * Purpose: `VAR_VALUE_SCHEMA`, one value of an app runway's `vars`: a literal, the string `from-port` (this member's
 *          own dev origin), a `ref:<output>` or `${pr}` value resolved at deploy, or a dev reference to another dev
 *          origin (`from-port: gateway`, `from-member: console`) with an optional scheme and path.
 * Boundary: internal; the shape only. `definesFor` resolves the references against the dev facts and the build
 *           environment. A reference names exactly one of `from-port` and `from-member`: a refinement stricter than
 *           the canonical `derived` (`minProperties: 1`), because a reference without one has no origin to resolve.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0175 (domains), ADR 0170 (no literal ports outside runway).
 */
import { z } from "zod";

/** A dev reference by port name or by member, with the scheme and path it adds to that origin. */
const REFERENCE = z
  .strictObject({
    "from-port": z.string().optional(),
    "from-member": z.string().optional(),
    scheme: z.string().optional(),
    path: z.string().optional(),
  })
  .refine(
    (reference) =>
      (reference["from-port"] === undefined) !== (reference["from-member"] === undefined),
    "Name exactly one of `from-port` and `from-member`",
  );

/** A literal, or a dev reference. */
export const VAR_VALUE_SCHEMA = z.union([
  z.union([z.string(), z.number(), z.boolean()]),
  REFERENCE,
]);

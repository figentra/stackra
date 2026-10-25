/**
 * Stackra file contract:
 * Purpose: `parseOptions`, a driver's pack options checked against its zod schema: the trust boundary between pack
 *          data and driver code.
 * Boundary: a pure function; a misfit is `FiscalOptionsInvalidError` naming every issue, never a partial parse.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2); ADR 0363 (decision 3).
 */
import type { z } from "zod";

import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";

/**
 * The parsed options.
 *
 * @example
 * const options = parseOptions(PEPPOL_OPTIONS, context.options, this.key);
 * @throws FiscalOptionsInvalidError when the options do not fit.
 */
export function parseOptions<S extends z.ZodType>(
  schema: S,
  options: unknown,
  driver: string,
): z.output<S> {
  const result = schema.safeParse(options);
  if (result.success) return result.data;
  const issues = result.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  throw FiscalOptionsInvalidError.create({ driver, issues: issues.join("; ") });
}

/**
 * Stackra file contract:
 * Purpose: `identifier(format)`, the schema of an identifier field checked against its Market's `IdentifierFormat`
 *          (national ID, VAT or TRN, IBAN), whose output is the normalised value.
 * Boundary: the format is market-pack data, read by the caller for the record's Market and passed in; the schema is
 *           built per format. A value that fails is refused with one message, never the format itself.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); round 3 #36.
 */
import { z } from "zod";
import type { ZodType } from "zod";

import { checkIdentifier } from "#core/functions/check-identifier.function";
import type { IdentifierFormat } from "#core/types/identifier-format.type";

/**
 * A new schema of identifiers in `format`.
 *
 * @example
 * const taxNumber = identifier(valueOf(pack, "identity.vat_number", today).value as IdentifierFormat);
 */
export function identifier(format: IdentifierFormat): ZodType<string, string> {
  return z.string().transform((value, context) => {
    const normalised = checkIdentifier(value, format);
    if (normalised === null) {
      context.addIssue({ code: "custom", message: "Expected a valid identifier for this market" });
      return z.NEVER;
    }
    return normalised;
  });
}

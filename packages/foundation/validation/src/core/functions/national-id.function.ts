/**
 * Stackra file contract:
 * Purpose: `nationalId(formats)`, the schema of a `NationalId` in one Market: the kind must be one the Market issues,
 *          and the number must pass that kind's `IdentifierFormat`; the output holds the stored form.
 * Boundary: the formats are the Market's `identity.national_ids` pack value (parsed with `NationalIdFormats$`), which
 *           the caller reads for the issuing country. Whether the country matches the Market is the caller's rule. A
 *           refusal never echoes the number.
 * Runtime: isomorphic
 * Governing contract: OS parties gap (STA-1269); owner principle 2026-10-25 (configuration, not code); round 3 #36.
 */
import { z } from "zod";
import type { ZodType } from "zod";

import { checkIdentifier } from "#core/functions/check-identifier.function";
import { countryCode } from "#core/functions/country-code.function";
import type { IdentifierFormat } from "#core/types/identifier-format.type";
import type { NationalId } from "#core/types/national-id.type";

/**
 * A new schema of identity document numbers issued under `formats`.
 *
 * @example
 * const id = nationalId(NationalIdFormats$.parse(valueOf(pack, "identity.national_ids", today)?.value));
 * id.parse({ country: "SA", kind: "national_id", number: "1012345672" });
 */
export function nationalId(
  formats: Readonly<Record<string, IdentifierFormat>>,
): ZodType<NationalId, unknown> {
  return z
    .object({ country: countryCode(), kind: z.string(), number: z.string() })
    .transform((value, context) => {
      const format = Object.hasOwn(formats, value.kind) ? formats[value.kind] : undefined;
      if (format === undefined) {
        context.addIssue({ code: "custom", path: ["kind"], message: "Not issued in this market" });
        return z.NEVER;
      }
      const number = checkIdentifier(value.number, format);
      if (number === null) {
        context.addIssue({ code: "custom", path: ["number"], message: "Not valid in this market" });
        return z.NEVER;
      }
      return { ...value, number };
    }) as unknown as ZodType<NationalId, unknown>;
}

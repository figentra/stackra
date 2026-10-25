/**
 * Stackra file contract:
 * Purpose: `address(format)`, the schema of an `Address` in one Market: trimmed parts, at least one and at most
 *          `maxLines` street lines, the parts the format requires, and the postal code and short address checked
 *          against their formats (and stored normalised).
 * Boundary: the format is market-pack data the caller passes for the address's Market. The country must be a known
 *           region; whether it matches the Market is the caller's rule.
 * Runtime: isomorphic
 * Governing contract: OS-370 and COM-117; owner principle 2026-10-25 (configuration, not code).
 */
import { z } from "zod";
import type { ZodType } from "zod";

import { checkIdentifier } from "#core/functions/check-identifier.function";
import { countryCode } from "#core/functions/country-code.function";
import type { Address } from "#core/types/address.type";
import type { AddressFormat } from "#core/types/address-format.type";

/** An optional trimmed part; an empty one counts as missing. */
const part = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value));

/**
 * A new schema of addresses in `format`.
 *
 * @example
 * const shipping = address(valueOf(pack, "identity.address_format", today).value as AddressFormat);
 */
export function address(format: AddressFormat): ZodType<Address, unknown> {
  const maxLines = format.maxLines ?? 1;
  return z
    .object({
      lines: z.array(z.string().trim().min(1)).min(1).max(maxLines),
      district: part(),
      locality: part(),
      region: part(),
      postalCode: part(),
      shortCode: part(),
      country: countryCode(),
    })
    .transform((value, context) => {
      for (const field of format.required)
        if (value[field] === undefined)
          context.addIssue({ code: "custom", path: [field], message: "Required in this market" });
      const checked = { ...value };
      for (const field of ["postalCode", "shortCode"] as const) {
        const rule = format[field];
        const given = value[field];
        if (rule === undefined || given === undefined) continue;
        const normalised = checkIdentifier(given, rule);
        if (normalised === null)
          context.addIssue({ code: "custom", path: [field], message: "Not valid in this market" });
        else checked[field] = normalised;
      }
      return Object.fromEntries(
        Object.entries(checked).filter(([, entry]) => entry !== undefined),
      ) as unknown as Address;
    }) as unknown as ZodType<Address, unknown>;
}

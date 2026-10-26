/**
 * Stackra file contract:
 * Purpose: `ADDRESS_SCHEMA`, the shipped `Address$`: the market-neutral shape of an `Address` (at least one line, the
 *          optional parts trimmed, a country code) that `stackra gen` compiles a field typed `Address` to.
 * Boundary: shape only. Which parts a Market requires, and its postal and short-code formats, are `address(format)`
 *           with the Market's `AddressFormat`; a service that knows the Market checks with that instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); OS-370; COM-117; STA-1284.
 */
import { z } from "zod";

import { countryCode } from "#core/functions/country-code.function";
import type { Address } from "#core/types/address.type";

/** An optional trimmed part. */
const part = () => z.string().trim().min(1).exactOptional();

/** The shipped `Address$`. */
export const ADDRESS_SCHEMA: z.ZodType<Address> = z.object({
  lines: z.array(z.string().trim().min(1)).min(1),
  district: part(),
  locality: part(),
  region: part(),
  postalCode: part(),
  shortCode: part(),
  country: countryCode(),
}) as unknown as z.ZodType<Address>;

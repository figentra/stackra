/**
 * Stackra file contract:
 * Purpose: `ADDRESS_FORMAT_SCHEMA`, the shipped `AddressFormat$`: parses the market pack's `identity.address_format`
 *          value into an `AddressFormat`, so `address(format)` is fed from the pack without a cast, and a pack's section
 *          schema can declare the key with `z.toJSONSchema(AddressFormat$)`.
 * Boundary: shape only. The part names are the `AddressField` names of `Address`; nothing here knows a Market.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0417 (section schemas); ADR 0405; OS tenancy G8 (STA-1269).
 */
import { z } from "zod";

import { IDENTIFIER_FORMAT_SCHEMA } from "#core/constants/identifier-format-schema.constant";
import type { AddressFormat } from "#core/types/address-format.type";

/** The parts a format may require: every `AddressField`. */
const field = z.enum(["district", "locality", "region", "postalCode", "shortCode"]);

/** The shipped `AddressFormat$`. */
export const ADDRESS_FORMAT_SCHEMA: z.ZodType<AddressFormat> = z.object({
  required: z.array(field),
  region: IDENTIFIER_FORMAT_SCHEMA.exactOptional(),
  postalCode: IDENTIFIER_FORMAT_SCHEMA.exactOptional(),
  shortCode: IDENTIFIER_FORMAT_SCHEMA.exactOptional(),
  maxLines: z.int().min(1).exactOptional(),
  layout: z.array(z.array(z.union([field, z.enum(["lines", "country"])])).min(1)),
}) as unknown as z.ZodType<AddressFormat>;

/**
 * Stackra file contract:
 * Purpose: `LengthUnit`, the units a length is shown in (centimetres or inches), with the Intl unit identifier each
 *          formats with as case data.
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are `@stackra/support`'s `QuantityUnit`
 *           codes, so a `Quantity` converts to one directly. Which unit a Market or a user sees is market-pack data and
 *           the user's setting, never a default here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: Enum.of); row "length units" of the package needs (2026-10-25); Fashion
 *                     (garment measurements).
 */
import { Enum } from "@stackra/contracts";

/** The display units of length; `Enum.meta(LengthUnit, u).intl` is the Intl unit. */
export const LengthUnit = Enum.of({
  /** Centimetres. */
  Cm: ["cm", { intl: "centimeter" }],
  /** Inches. */
  In: ["in", { intl: "inch" }],
});

/** One of the codes above. */
export type LengthUnit = Enum.Value<typeof LengthUnit>;

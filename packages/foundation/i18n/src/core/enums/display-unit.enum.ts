/**
 * Stackra file contract:
 * Purpose: `DisplayUnit`, the metric and imperial units a stored mass, length or volume may be shown in, with the Intl
 *          unit identifier each formats with as case data, so a Market shows pounds, inches or gallons over values
 *          stored in grams, metres and millilitres.
 * Boundary: an `Enum.of` value plus the type of the same name. The codes are `@stackra/support`'s `QuantityUnit`
 *           codes, so a `Quantity` converts to one exactly. Which unit a Market or user sees is market-pack data and
 *           the user's setting, never a default here; storage stays metric.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: Enum.of); ADR 0403 (imperial display over metric storage).
 */
import { Enum } from "@stackra/contracts";

/** The display units; `Enum.meta(DisplayUnit, u).intl` is the Intl unit. */
export const DisplayUnit = Enum.of({
  /** Grams. */
  G: ["g", { intl: "gram" }],
  /** Kilograms. */
  Kg: ["kg", { intl: "kilogram" }],
  /** Ounces (avoirdupois). */
  Oz: ["oz", { intl: "ounce" }],
  /** Pounds (avoirdupois). */
  Lb: ["lb", { intl: "pound" }],
  /** Millimetres. */
  Mm: ["mm", { intl: "millimeter" }],
  /** Centimetres. */
  Cm: ["cm", { intl: "centimeter" }],
  /** Metres. */
  M: ["m", { intl: "meter" }],
  /** Inches. */
  In: ["in", { intl: "inch" }],
  /** Feet. */
  Ft: ["ft", { intl: "foot" }],
  /** Yards. */
  Yd: ["yd", { intl: "yard" }],
  /** Millilitres. */
  Ml: ["ml", { intl: "milliliter" }],
  /** Litres. */
  L: ["l", { intl: "liter" }],
  /** US fluid ounces. */
  FlOz: ["fl_oz", { intl: "fluid-ounce" }],
  /** US liquid gallons. */
  Gal: ["gal", { intl: "gallon" }],
});

/** One of the codes above. */
export type DisplayUnit = Enum.Value<typeof DisplayUnit>;

/**
 * Stackra file contract:
 * Purpose: `QUANTITY_UNITS`, every unit a `Quantity` may carry, by code, with its dimension and its exact factor to the
 *          dimension's base unit (gram, metre, millilitre, piece), written as a terminating decimal string.
 * Boundary: physical definitions only (the international yard and pound of 1959, the US liquid gallon): never a
 *           Market's choice of unit, which is market-pack data. A new unit is a new row with its exact factor.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); COM-76 (sell by weight, length or volume).
 */

/** One unit: the dimension it measures and how many base units one of it is, exactly. */
interface UnitDefinition {
  /** What it measures. */
  readonly dimension: "mass" | "length" | "volume" | "count";

  /** Base units in one of this unit, as an exact decimal (an inch is `"0.0254"` metres). */
  readonly factor: string;
}

/**
 * The units, by code. The base of each dimension has factor `"1"`.
 *
 * @example
 * QUANTITY_UNITS.in; // { dimension: "length", factor: "0.0254" }
 */
export const QUANTITY_UNITS = Object.freeze({
  mg: { dimension: "mass", factor: "0.001" },
  g: { dimension: "mass", factor: "1" },
  kg: { dimension: "mass", factor: "1000" },
  oz: { dimension: "mass", factor: "28.349523125" },
  lb: { dimension: "mass", factor: "453.59237" },
  mm: { dimension: "length", factor: "0.001" },
  cm: { dimension: "length", factor: "0.01" },
  m: { dimension: "length", factor: "1" },
  in: { dimension: "length", factor: "0.0254" },
  ft: { dimension: "length", factor: "0.3048" },
  yd: { dimension: "length", factor: "0.9144" },
  ml: { dimension: "volume", factor: "1" },
  l: { dimension: "volume", factor: "1000" },
  fl_oz: { dimension: "volume", factor: "29.5735295625" },
  gal: { dimension: "volume", factor: "3785.411784" },
  piece: { dimension: "count", factor: "1" },
} as const satisfies Readonly<Record<string, UnitDefinition>>);

/**
 * Stackra file contract:
 * Purpose: `fieldLabelPath(key)`, the label path of a form key: a list row's index is dropped, so every row of a list
 *          shares its field's label (`parcels.0.weight` is `parcels.weight`).
 * Boundary: internal: pure; the web and native form fields take labels and enum labels by it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the create or update input).
 */

/**
 * The label path of `key`.
 *
 * @example
 * fieldLabelPath("parcels.0.weight"); // "parcels.weight"
 */
export function fieldLabelPath(key: string): string {
  return key.replaceAll(/\.\d+(?=\.|$)/g, "");
}

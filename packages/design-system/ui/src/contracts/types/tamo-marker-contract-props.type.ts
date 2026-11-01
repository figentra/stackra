/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TamoMarker` takes: the AI-made marker on content Tamo made, or on a field Tamo filled
 *          that still needs the person's check.
 * Boundary: types only; the words default to the `ui` catalogue.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system).
 */
/** Props shared by the web and native `TamoMarker`. */
export interface TamoMarkerContractProps {
  /** True for a field Tamo filled that the person has not checked yet ("Filled by Tamo, check it"). */
  readonly needsReview?: boolean | undefined;
  /** The words; default "Made with Tamo", or the review words. */
  readonly label?: string | undefined;
}

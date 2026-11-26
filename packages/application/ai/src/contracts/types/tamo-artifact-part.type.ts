/**
 * Stackra file contract:
 * Purpose: `TamoArtifactPart`, the data of a `data-tamo-artifact` part: a saved artifact by id, name, kind and
 *          version.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
/** A saved artifact in a chat turn. */
export interface TamoArtifactPart {
  /** The artifact's id. */
  readonly artifactId: string;

  /** The artifact's name. */
  readonly name: string;

  /** What the artifact is: `pdf`, `csv`, `xlsx`, `jsonl` or `svg` (its file extension). */
  readonly kind: string;

  /** The version this turn shows. */
  readonly version: number;

  /** The version's size in bytes, when known. */
  readonly bytes?: number;
}

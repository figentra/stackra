/**
 * Stackra file contract:
 * Purpose: `TamoDataPartType`, the AI SDK part type of each Tamo data part: `data-tamo-<kind>`.
 * Boundary: a type only; the data of one AI SDK data part, drawn by the host's renderer, never markup from the
 *           model.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoPartKind } from "#contracts/enums/tamo-part-kind.enum";

/** The `type` of a Tamo data part on the wire. */
export type TamoDataPartType = `data-tamo-${TamoPartKind}`;

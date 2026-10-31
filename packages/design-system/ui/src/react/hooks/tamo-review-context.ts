/**
 * Stackra file contract:
 * Purpose: `TamoReviewContext`, the names of the form fields Tamo filled that the person has not checked yet; a
 *          text field whose `name` is listed shows the "Filled by Tamo, check it" marker.
 * Boundary: the context only; the `Form` fills it when the person applies Tamo's fill and empties it on Keep all or
 *           Undo.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (form fill: filled fields marked for review); ADR 0021.
 */
import { createContext } from "react";

/** The field names awaiting the person's check. */
export const TamoReviewContext = createContext<ReadonlySet<string>>(new Set());

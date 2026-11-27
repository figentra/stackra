/**
 * Stackra file contract:
 * Purpose: `InspectionRow`, one row as an inspection's connection returns it: column name to driver value.
 * Boundary: a type only, internal to `openInspectionSession` and the three inspections.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2906.
 */

/** A row as the driver returns it. */
export type InspectionRow = Readonly<Record<string, unknown>>;

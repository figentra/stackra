/**
 * Stackra file contract:
 * Purpose: `ColumnMapping`, which source column feeds each target field: field name to header text.
 * Boundary: a type only. Headers are matched after `normalizeHeader`, so a mapping saved from one file applies to
 *           another whose headers differ only in diacritics, spacing or case. A saved mapping profile is this value
 *           stored by the consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */

/** Field name to header text. */
export type ColumnMapping = Readonly<Record<string, string>>;

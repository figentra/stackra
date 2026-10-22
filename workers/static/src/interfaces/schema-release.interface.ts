/**
 * Stackra file contract:
 * Purpose: the shape of one schema release: a version and the schema files as they were at its git tag.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 3).
 */
import type { SchemaSource } from "./schema-source.interface";

/** The schemas at one `schemas@<version>` tag. */
export interface SchemaRelease {
  /** Plain `major.minor.patch`, already stripped of the tag prefix and validated. */
  version: string;
  /** Every `*.schema.json` under tools/schemas at the tag; empty when the tag predates the folder. */
  schemas: SchemaSource[];
}

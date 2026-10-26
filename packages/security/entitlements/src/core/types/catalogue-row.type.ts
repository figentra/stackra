/**
 * Stackra file contract:
 * Purpose: `CatalogueRow`, one row of a catalogue version as stored: a JSON object naming its `record` kind and `id`.
 * Boundary: a type only; untrusted admin or seed data until a parser such as `planCatalogueOf` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 and 5); config-model section 2.
 */
import type { Json } from "@stackra/contracts";

/** A stored catalogue row. */
export type CatalogueRow = Readonly<Record<string, Json>>;

/**
 * Stackra file contract:
 * Purpose: `RUNWAY_SCHEMAS`, each runway kind to its zod schema: the one lookup `parseRunway` and `runwayJsonSchema`
 *          share, so the parsed type and the JSON Schema file can never describe different documents.
 * Boundary: internal; not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2).
 */
import { APP_RUNWAY_SCHEMA } from "#core/constants/app-runway-schema.constant";
import { ROOT_RUNWAY_SCHEMA } from "#core/constants/root-runway-schema.constant";
import { SERVICE_RUNWAY_SCHEMA } from "#core/constants/service-runway-schema.constant";

/** Runway kind to schema. */
export const RUNWAY_SCHEMAS = {
  root: ROOT_RUNWAY_SCHEMA,
  app: APP_RUNWAY_SCHEMA,
  service: SERVICE_RUNWAY_SCHEMA,
} as const;

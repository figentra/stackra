/**
 * Stackra file contract:
 * Purpose: `PACKAGE_LIST_SCHEMA`, a list of scoped package names, each once: the packages a surface's extension
 *          bundle or a mobile app is built from.
 * Boundary: internal; the surface and mobile app schemas compose it.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 2 and 4), ADR 0441 (decision 3).
 */
import { z } from "zod";

import { PACKAGE_NAME_SCHEMA } from "#core/constants/package-name-schema.constant";

/** Unique scoped package names. */
export const PACKAGE_LIST_SCHEMA = z
  .array(PACKAGE_NAME_SCHEMA)
  .refine((names) => new Set(names).size === names.length, "A package is listed more than once");

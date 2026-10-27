/**
 * Stackra file contract:
 * Purpose: `EDITION_BUNDLE_SCHEMA`, the shipped zod schema of `EditionBundle`: the edition's product key, its base and
 *          base version range, its own modules, the base modules it bundles, and the range packs and role presets it
 *          seeds (record keys, each once; optional, so a bundle recorded before them still parses).
 * Boundary: internal; `edition-bundle.schema.ts` registers it. Keys are one snake_case segment each, as module keys
 *           are; a product key is lower case with hyphens, as the root runway writes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decisions 2, 4, 5 and 6); ADR 0294 (decision 26); stackra-64 (range packs, role
 *                     presets).
 */
import { z } from "zod";

/** A module key. */
const MODULE = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, "must be one snake_case segment");

/** A product key. */
const PRODUCT = z.string().regex(/^[a-z][a-z0-9-]*$/, "must be a lower-case product key");

/** Module keys, each once. */
const MODULES = z
  .array(MODULE)
  .refine((keys) => new Set(keys).size === keys.length, "a module is listed more than once");

/** Record keys (`range:fashion-basics`, `role-preset:stylist`), each once. */
const RECORDS = z
  .array(
    z
      .string()
      .regex(/^[a-z][a-z0-9_-]*(?::[a-z0-9][a-z0-9_.-]*)*$/, "must be a lower-case record key"),
  )
  .refine((keys) => new Set(keys).size === keys.length, "a record is listed more than once");

/** The shipped `EditionBundle$`. */
export const EDITION_BUNDLE_SCHEMA = z.object({
  product: PRODUCT,
  edition: z.object({ of: PRODUCT, version: z.string().min(1) }),
  modules: MODULES,
  bundles: MODULES,
  packs: RECORDS.optional(),
  rolePresets: RECORDS.optional(),
});

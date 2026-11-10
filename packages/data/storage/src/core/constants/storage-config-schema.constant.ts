/**
 * Stackra file contract:
 * Purpose: `STORAGE_CONFIG_SCHEMA`, the zod schema this package ships for `StorageConfig` (exported as
 *          `StorageConfig$`): which `Storage` driver runs.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `StorageOptions`' initializers (tested). A driver name only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0256.
 */
import { z } from "zod";

import { STORAGE_DRIVERS } from "#core/constants/storage-drivers.constant";

/** The shipped `StorageConfig$`. */
export const STORAGE_CONFIG_SCHEMA = z.object({
  driver: z.enum(STORAGE_DRIVERS).default("memory"),
});

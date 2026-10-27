/**
 * Stackra file contract:
 * Purpose: `PRIVACY_CONFIG_SCHEMA`, the shipped `PrivacyConfig$`: the store driver, how many days an export link
 *          and its file live (seven by default, ADR 0189 decision 1), and the folder exports are written to.
 * Boundary: a zod object with every default, so the configuration builds from nothing; `PrivacyOptions` registers it.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 1: a signed zip for seven days); ADR 0146 as amended; STA-1375.
 */
import { z } from "zod";

import { PERSONAL_DATA_STORE_DRIVERS } from "#core/constants/personal-data-store-drivers.constant";

/** The shipped `PrivacyConfig$`. */
export const PRIVACY_CONFIG_SCHEMA = z.object({
  store: z.enum(PERSONAL_DATA_STORE_DRIVERS).default("repository"),
  exportTtlDays: z.number().int().min(1).max(30).default(7),
  exportFolder: z
    .string()
    .regex(/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/)
    .default("privacy/exports"),
});

/**
 * Stackra file contract:
 * Purpose: `CHECKLIST_STEP_KEY`, the zod schema of a checklist step key: snake_case, 1 to 63 characters
 *          (`connect_payments`).
 * Boundary: internal; the checklist template, customization and industry profile schemas share it, so a key one
 *           accepts the others accept.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 1); ADR 0231 (machine codes are snake_case).
 */
import { z } from "zod";

/** A step key. */
export const CHECKLIST_STEP_KEY = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,62}$/, "Expected a snake_case step key such as connect_payments");

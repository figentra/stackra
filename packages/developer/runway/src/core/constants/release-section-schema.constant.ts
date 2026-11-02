/**
 * Stackra file contract:
 * Purpose: `RELEASE_SECTION_SCHEMA`, the root runway's `release` block as a closed object, so a misspelt key fails
 *          `parseRunway` instead of passing silently.
 * Boundary: internal; validation only, with no defaults. `release` has no owner schema: its keys are the ones the
 *           repositories use, and only `buildOrder` is read today (`deployPlan`).
 * Runtime: isomorphic
 * Governing contract: ADR 0296; the Runway inventory of 2026-11-02 (static/ finding 1); STA-1976.
 */
import { z } from "zod";

/** One window a release avoids: a local time range on named days, or the first days of a term. */
const AVOID_WINDOW = z.union([
  z.strictObject({ local: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/), days: z.string().min(1) }),
  z.strictObject({
    termStart: z.strictObject({
      firstDays: z.union([z.int().min(1), z.string().min(1)]),
      source: z.string().min(1),
    }),
  }),
]);

/** The release policy: build order, promotion, gates, rollback, strategy, records and on-premises upgrades. */
export const RELEASE_SECTION_SCHEMA = z.strictObject({
  buildOrder: z.array(z.string().min(1)).optional(),
  promote: z.strictObject({ unit: z.enum(["sha", "digest"]) }).optional(),
  gate: z
    .strictObject({
      health: z.string().min(1).optional(),
      smoke: z.string().min(1).optional(),
      errorWatchMinutes: z.int().min(0).optional(),
    })
    .optional(),
  rollback: z
    .strictObject({ by: z.string().min(1).optional(), withinMinutes: z.int().min(0).optional() })
    .optional(),
  strategy: z
    .strictObject({
      kind: z.string().min(1).optional(),
      healthGate: z.boolean().optional(),
      autoRollback: z.boolean().optional(),
    })
    .optional(),
  records: z.array(z.string().min(1)).optional(),
  onPrem: z
    .strictObject({
      backup: z.string().min(1).optional(),
      migrationsAsJob: z.boolean().optional(),
      preflight: z.boolean().optional(),
      upgrades: z.string().min(1).optional(),
    })
    .optional(),
  windows: z.strictObject({ avoid: z.array(AVOID_WINDOW).optional() }).optional(),
});

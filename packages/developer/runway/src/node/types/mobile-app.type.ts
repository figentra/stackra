/**
 * Stackra file contract:
 * Purpose: `MobileApp`, one parsed app of the root runway's `mobile` block (template line, packages, asset and store
 *          paths, identity, capabilities, tablet, store accounts, EAS project and channel, white-label variants).
 * Boundary: type only, derived from `RootRunway` so it never drifts from the schema.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 3), ADR 0439 (decision 2).
 */
import type { RootRunway } from "#core/types/root-runway.type";

/** One mobile app of the root runway. */
export type MobileApp = NonNullable<RootRunway["mobile"]>[string];

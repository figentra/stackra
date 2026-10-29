/**
 * Stackra file contract:
 * Purpose: `LiveActivityOptions`, the Live Activity defaults: how long an ended order or booking stays on the Lock
 *          Screen before the OS removes it.
 * Boundary: defaults only; a host overrides them in its `LiveActivityConfig`. iOS caps the stay at four hours.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); config-model; STA-1539.
 */
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { LIVE_ACTIVITY_CONFIG_SCHEMA } from "#core/constants/live-activity-config-schema.constant";

/** The Live Activity defaults. */
export class LiveActivityOptions extends Schema {
  /** How long an ended activity stays on the Lock Screen, showing its final state. */
  endedDismissal: Duration = Duration.minutes(15);
}

registerSchemas([[LiveActivityOptions, LIVE_ACTIVITY_CONFIG_SCHEMA]]);

/**
 * Stackra file contract:
 * Purpose: `CollaborationOptions`, the shape of `CollaborationConfig`: the shortest wait between two cursor messages,
 *          the longest wait before a changed co-edited document is saved as a snapshot, and the presence heartbeat.
 * Boundary: a shape class; it registers this package's own schema (`COLLABORATION_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(CollaborationConfig)` validates with no generated file. Driver choices are
 *           not here: the host binds the ports (`realtime` drivers over @stackra/realtime rooms, `postgres`
 *           snapshots, or the memory drivers of `./testing`).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2); ADR 0294 (decisions 19 and 26).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { COLLABORATION_CONFIG_SCHEMA } from "#core/constants/collaboration-config-schema.constant";

/**
 * The collaboration settings.
 *
 * @example
 * export class CollaborationConfig extends BaseCollaborationConfig {
 *   override snapshotIntervalSeconds = 10;
 * }
 */
export class CollaborationOptions extends Schema {
  /** The shortest wait between two cursor messages from this client, in milliseconds (16 to 1,000). */
  @Int({
    min: 16,
    max: 1000,
  })
  cursorIntervalMilliseconds = 50;

  /** The longest wait before local changes are saved as a snapshot, in seconds (1 to 3,600). */
  @Int({
    min: 1,
    max: 3600,
  })
  snapshotIntervalSeconds = 30;

  /** How often the realtime presence driver re-announces presence, in seconds (1 to 3,600), under the idle close. */
  @Int({
    min: 1,
    max: 3600,
  })
  presenceHeartbeatSeconds = 20;
}

registerSchemas([[CollaborationOptions, COLLABORATION_CONFIG_SCHEMA]]);

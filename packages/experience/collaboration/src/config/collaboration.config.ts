/**
 * Stackra file contract:
 * Purpose: `CollaborationConfig`, the configuration of @stackra/collaboration (key `collaboration`): the cursor send
 *          interval `CollaborationSession` throttles to, the snapshot interval `SnapshotService` saves at, and the
 *          presence heartbeat of the realtime presence driver.
 * Boundary: a configuration class over `CollaborationOptions` with no env map; runway's `config.collaboration` layer
 *           sets it per environment. A host overrides it under the same name, with this class aliased
 *           `BaseCollaborationConfig`, by `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0295 (decision 10); ADR 0146 as amended.
 */
import { Config } from "@stackra/config";

import { CollaborationOptions } from "#core/schemas/collaboration-options.schema";

/**
 * Collaboration settings.
 *
 * @example
 * import { CollaborationConfig as BaseCollaborationConfig } from "@stackra/collaboration";
 *
 * export class CollaborationConfig extends BaseCollaborationConfig {
 *   override cursorIntervalMilliseconds = 100;
 * }
 */
export class CollaborationConfig extends Config({ schema: CollaborationOptions }) {}

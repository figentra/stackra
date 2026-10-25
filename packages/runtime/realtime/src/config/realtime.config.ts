/**
 * Stackra file contract:
 * Purpose: `RealtimeConfig`, a member's realtime configuration (key `realtime`): the server driver, the realms allowed
 *          on tenant channels, the subscribe token lifetime, the origin, the client's background and reconnect
 *          behaviour, the fan-out between instances (with its `REALTIME_VALKEY_URL` secret) and the room caps.
 * Boundary: a configuration class over `RealtimeOptions` with no env map: the origin's variable differs per target
 *           (`VITE_`, `EXPO_PUBLIC_`), so the host feeds it from its own env configuration. Its presence in an app's
 *           module graph mounts the realtime context; a service's selects the driver gen binds.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0225 (decision 1); ADR 0295 (decision 10).
 */
import { Config } from "@stackra/config";

import { RealtimeOptions } from "#core/schemas/realtime-options.schema";

/**
 * A member's realtime configuration.
 *
 * @example
 * import { RealtimeConfig as BaseRealtimeConfig } from "@stackra/realtime";
 *
 * export class RealtimeConfig extends BaseRealtimeConfig {
 *   override reconnectOnForeground = true;
 *   override backgroundGraceSeconds = 30;
 * }
 */
export class RealtimeConfig extends Config({ schema: RealtimeOptions }) {}

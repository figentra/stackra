/**
 * Stackra file contract:
 * Purpose: `ActionOptions`, what `Action({...})` takes: the written key, the actors, the permission when the stem
 *          differs, the preconditions, interceptors, idempotency and rate limit the pipeline applies, and the surfaces
 *          (`endpoint`, `tool`, `intent`, `job`, `offline`), the client rule code it accepts (`accepts`), whether it
 *          changes structural configuration (`structural`) and the meter it feeds (`meter`).
 * Boundary: a type only. Everything gen derives is absent: the module, the locked key `<module>.<model>.<verb>@<major>`,
 *           the permission name and its risk, the route and the MCP tool name. `permission` names a `Permissions`
 *           static only when the class stem differs from the action's model (ADR 0305 rule 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 7, 9, 28 and 30); ADR 0136 (decision 3);
 *                     ADR 0138 (as amended); ADR 0252 (decision 2); ADR 0338 (decision 5); ADR 0337 (decisions 4
 *                     and 5); ADR 0359 (decisions 3 and 5); ADR 0216 (decisions 1 and 2).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind, ApiArea } from "@stackra/contracts";

import type { Interceptor } from "#core/bases/interceptor.base";
import type { Precondition } from "#core/bases/precondition.base";
import type { Idempotency } from "#core/enums/idempotency.enum";
import type { ActionAccepts } from "#core/types/action-accepts.type";
import type { ActionMeter } from "#core/types/action-meter.type";
import type { ActionRateLimit } from "#core/types/action-rate-limit.type";
import type { EndpointOptions } from "#core/types/endpoint-options.type";
import type { JobOptions } from "#core/types/job-options.type";
import type { OfflineOptions } from "#core/types/offline-options.type";

/** The options of an action. */
export interface ActionOptions {
  /** `<model>.<verb>` in snake_case (`order.create`, `inbox_message.mark_read`), written once. */
  readonly key: string;

  /** The actor kinds that may call it; any other is refused (`forbidden`). */
  readonly actors: readonly ActorKind[];

  /** A `Permissions` static (`StockPermissions.manage`) when the permission's class stem differs from the model. */
  readonly permission?: unknown;

  /** The major version, a whole number from 1; `1` when absent. */
  readonly version?: number;

  /** The API area its endpoint and rate-limit bucket belong to; `ApiArea.App` when absent. */
  readonly area?: ApiArea;

  /** Whether the call may run now, whoever asks; checked in order after the permission. */
  readonly preconditions?: readonly AnyClass<Precondition>[];

  /** Wrappers around the whole call, between idempotency and `handle`, the first outermost. */
  readonly interceptors?: readonly AnyClass<Interceptor>[];

  /** The Idempotency-Key policy; `Idempotency.Optional` when absent. */
  readonly idempotency?: Idempotency;

  /** The action's own token bucket, on top of the area's. */
  readonly rateLimit?: ActionRateLimit;

  /** A route override, or `false` for no endpoint; derived from the key when absent. */
  readonly endpoint?: EndpointOptions | false;

  /** Expose it as an MCP tool (off by default for actions); needs an agent actor. */
  readonly tool?: boolean;

  /** Let the intent router and the palette start it, with phrases from the lang files. */
  readonly intent?: boolean;

  /** Also run it as a queued or scheduled job; needs the system or job actor. */
  readonly job?: JobOptions;

  /** What clients may do with it offline; online-only when absent. */
  readonly offline?: OfflineOptions;

  /** The offline-computed documents it takes: the oldest rule version without review and the server's evaluator. */
  readonly accepts?: ActionAccepts;

  /** It changes structural configuration, which is read-only in live (`LiveConfigurationGuard`); `false` when absent. */
  readonly structural?: boolean;

  /** The meter each applied call feeds through a `usage.recorded` event; unmetered when absent. */
  readonly meter?: ActionMeter;
}

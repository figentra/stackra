/**
 * Stackra file contract:
 * Purpose: `ActionOptions`, what `Action({...})` takes: the written key, the actors, the permission when the stem
 *          differs, the preconditions, interceptors, idempotency and rate limit the pipeline applies, and the surfaces
 *          (`endpoint`, `tool`, `intent`, `job`, `offline`), its effect tags (`effects`), the client rule code it accepts (`accepts`), whether it
 *          changes structural configuration (`structural`), the meter it feeds (`meter`), whether it always needs an
 *          approval gate (`approval`), the assurance level it needs (`stepUp`) and the statement timeout of its unit of
 *          work (`timeout`), and the analytics event each call writes (`analytics`), and the most statements a
 *          call may run (`queryBudget`).
 * Boundary: a type only. Everything gen derives is absent: the module, the locked key `<module>.<model>.<verb>@<major>`,
 *           the permission name and its risk, the route and the MCP tool name. `permission` names a `Permissions`
 *           static only when the class stem differs from the action's model (ADR 0305 rule 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 7, 9, 28 and 30); ADR 0136 (decision 3);
 *                     ADR 0138 (as amended); ADR 0252 (decision 2); ADR 0338 (decision 5); ADR 0337 (decisions 4
 *                     and 5); ADR 0359 (decisions 3 and 5); ADR 0216 (decisions 1 and 2); ADR 0360 (decision 4:
 *                     the tool default); ADR 0099 (decision 2: effect tags); ADR 0397 as amended by STA-813
 *                     (`approval`); ADR 0406 (`stepUp`); STA-1512 (`analytics`).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind, ApiArea, AssuranceLevel, Duration } from "@stackra/contracts";

import type { Interceptor } from "#core/bases/interceptor.base";
import type { Precondition } from "#core/bases/precondition.base";
import type { Idempotency } from "#core/enums/idempotency.enum";
import type { ActionAccepts } from "#core/types/action-accepts.type";
import type { ActionEffects } from "#core/types/action-effects.type";
import type { ActionMeter } from "#core/types/action-meter.type";
import type { ActionRateLimit } from "#core/types/action-rate-limit.type";
import type { CallAnalytics } from "#core/types/call-analytics.type";
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

  /**
   * Expose it as an MCP tool. When absent, an action a user can perform is a tool and any other is not (ADR 0360
   * decision 4, the same default gen applies); `tool: false` on a user action carries a `// reason:` line gen reads.
   */
  readonly tool?: boolean;

  /** The effect tags it declares (`[Effect.Financial]`); none when absent. Gen's registered tags win at runtime. */
  readonly effects?: ActionEffects;

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

  /**
   * Every call must pass an `ApprovalGate`: with none bound the call fails closed. When absent, the approval step runs
   * only when a gate is bound (which rules decide), and an app with no gate has no approvals.
   */
  readonly approval?: boolean;

  /**
   * The assurance level the caller's last authentication must reach, recently enough (`StepUpCheck` decides); the
   * call is refused `step_up_required` otherwise. No step-up when absent.
   */
  readonly stepUp?: AssuranceLevel;

  /**
   * The statement timeout inside its unit of work (`set local statement_timeout`), for an action that is known to run
   * longer or must fail faster than the configured session timeout (`DatabaseConfig.timeouts.statement`).
   */
  readonly timeout?: Duration;

  /**
   * The most database statements one call's `handle` may run (`QueryBudget` counts them): above it the call is
   * reported with its key, a warning in production and a failure in strict mode. No count limit when absent; a
   * statement shape repeated past the configured limit (an N+1 loop) is reported either way.
   */
  readonly queryBudget?: number;

  /**
   * The analytics event each call writes as `analytics.tracked.v1` when its consent grants `analytics`: `true` for
   * `action.called` (every outcome), or an `AnalyticsEvent` class (a successful call only, in its unit of work).
   */
  readonly analytics?: CallAnalytics;
}

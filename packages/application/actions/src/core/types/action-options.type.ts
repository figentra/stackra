/**
 * Stackra file contract:
 * Purpose: `ActionOptions`, what `Action({...})` takes: the written key, the actors, the permission when the stem
 *          differs, the preconditions, interceptors, idempotency and rate limit the pipeline applies, and the surfaces
 *          (`endpoint`, `tool`, `intent`, `job`, `offline`), its effect tags (`effects`), the client rule code it accepts (`accepts`), whether it
 *          changes structural configuration (`structural`), the meter it feeds (`meter`), whether it always needs an
 *          approval gate (`approval`), the assurance level it needs (`stepUp`) and the statement timeout of its unit of
 *          work (`timeout`), and the analytics event each call writes (`analytics`), and the most statements a
 *          call may run (`queryBudget`), and whether a service calling it for a user may forward the user's token
 *          once more (`onBehalfOf`), and whether an anonymous-only action drops a signed-in caller's credentials
 *          (`credentials`).
 * Boundary: a type only. Everything gen derives is absent: the module, the locked key `<module>.<model>.<verb>@<major>`,
 *           the permission name and its risk, the route and the MCP tool name. `permission` names a `Permissions`
 *           static only when the class stem differs from the action's model (ADR 0305 rule 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 21); ADR 0305 (rules 7, 9, 28 and 30); ADR 0136 (decision 3);
 *                     ADR 0138 (as amended); ADR 0252 (decision 2); ADR 0338 (decision 5); ADR 0337 (decisions 4
 *                     and 5); ADR 0359 (decisions 3 and 5); ADR 0216 (decisions 1 and 2); ADR 0360 (decision 4:
 *                     the tool default); ADR 0099 (decision 2: effect tags); ADR 0397 as amended by STA-813
 *                     (`approval`; ADR 0509 for the declared stage); ADR 0406 (`stepUp`); STA-1512 (`analytics`);
 *                     ADR 0209 (2026-11-07 amendment, condition 5: `onBehalfOf`).
 */
import type { AnyClass } from "@stackra/container";
import type { ActorKind, ApiArea, AssuranceLevel, Duration } from "@stackra/contracts";

import type { StepUpExemption } from "#contracts/types/step-up-exemption.type";
import type { Interceptor } from "#core/bases/interceptor.base";
import type { Precondition } from "#core/bases/precondition.base";
import type { Idempotency } from "#core/enums/idempotency.enum";
import type { ActionApproval } from "#core/types/action-approval.type";
import type { ActionAccepts } from "#core/types/action-accepts.type";
import type { ActionEffects } from "#core/types/action-effects.type";
import type { ActionMeter } from "#core/types/action-meter.type";
import type { ActionRateLimit } from "#core/types/action-rate-limit.type";
import type { CallAnalytics } from "#core/types/call-analytics.type";
import type { CallDataClass } from "#core/types/call-data-class.type";
import type { EntitlementOption } from "#core/types/entitlement-option.type";
import type { EndpointOptions } from "#core/types/endpoint-options.type";
import type { JobOptions } from "#core/types/job-options.type";
import type { OfflineOptions } from "#core/types/offline-options.type";
import type { OnBehalfOfOptions } from "#core/types/on-behalf-of-options.type";
import type { ActionPublic } from "#core/types/action-public.type";

/** The options of an action. */
export interface ActionOptions {
  /** `<model>.<verb>` in snake_case (`order.create`, `inbox_message.mark_read`), written once. */
  readonly key: string;

  /** Reachable with an API key (an `api_client` caller), with the scopes it must hold (ADR 0278); absent: never. */
  readonly public?: ActionPublic;

  /**
   * `handle` answers a `ReadableStream` of JSON chunks, sent to one live caller as server-sent events; the call's
   * transaction commits when `handle` returns it, so the stream's writes run in `ctx.detach()` steps. It takes no
   * `job`, no `offline`, no `tool` and only `Idempotency.Never` (`stream_not_replayable`). Absent: `false`.
   */
  readonly stream?: boolean;

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

  /**
   * How long a key and its kept output last, when shorter than the 24 hours of ADR 0136 (a longer one is ignored).
   * An output field marked `@ShownOnce` is never kept, whatever the window.
   */
  readonly idempotencyTtl?: Duration;

  /** The action's own token bucket, on top of the area's. */
  readonly rateLimit?: ActionRateLimit;

  /**
   * The data class it handles (`DataClassification.Financial`, or a product's `DataClass` class); gen records its key,
   * and the AI gateway keeps a run that calls it in region when the tenant's policy says so. None when absent.
   */
  readonly dataClass?: CallDataClass;

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

  /** The plan entitlement or entitlements a call needs; gen lists the call in each one's `gates` (ADR 0215). */
  readonly entitlement?: EntitlementOption;

  /** The meter each applied call feeds through a `usage.recorded` event; unmetered when absent. */
  readonly meter?: ActionMeter;

  /**
   * `true`: every call must pass an `ApprovalGate`; with none bound the call fails closed. An `ActionApproval`: a
   * declared stage, a floor of distinct approvers that tenant rules may raise and never lower, and the call runs as the
   * requester when the last one approves. When absent, the approval step runs only when a gate is bound (which rules
   * decide), and an app with no gate has no approvals.
   */
  readonly approval?: boolean | ActionApproval;

  /**
   * The assurance level the caller's last authentication must reach, recently enough (`StepUpCheck` decides); the
   * call is refused `step_up_required` otherwise. Asked of a user caller only: a service, job, system or agent call
   * carries no assurance (ADR 0406 as amended, STA-340). No step-up when absent. Gen refuses an L3 or L4 action a
   * user can call without it (`step_up_missing`). `{ exempt: "first-factor-enrolment" }` asks no step-up of the
   * pipeline: the action enforces its own (STA-340), and gen allows it only on its listed enrolment actions.
   */
  readonly stepUp?: AssuranceLevel | StepUpExemption;

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

  /**
   * `{ secondHop: true }` lets a service that calls this action for a user forward the user's token to the services the
   * action calls. One hop when absent: those calls carry the service token only (ADR 0209, amendment of 2026-11-07).
   */
  readonly onBehalfOf?: OnBehalfOfOptions;

  /**
   * `"ignore"` runs every call as a fresh anonymous visitor, whatever credential it carried: for a public page whose
   * visitors may also be signed in elsewhere. The bearer token, the session and the principal they resolve to never
   * reach the call: its actor, context, audit entry and span are the anonymous ones, and no user token is held for
   * forwarding. Only an action whose `actors` are exactly `[ActorKind.Anonymous]` may declare it. Absent, such an
   * action refuses a signed-in caller (`ForbiddenError`), which a sign-up relies on.
   */
  readonly credentials?: "ignore";
}

/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/actions` (`Action`,
 *          `ConflictResolution`, `Extension`, `ExtensionPoint`, `IdMinting`, `Idempotency`, `OfflineMode`,
 *          `OfflinePrecondition`, `Precondition`, `Query`, `RateLimitConfig`, `RateLimitConfig$`, `RequestContext`)
 *          and the registry row's runtime are exported with the offline additions (the device, cap, replica and review
 *          memory drivers, `ReplicaFeed` and two refusals; no header name), the query cache's `CacheScope`,
 *          `registerCachedQueries`, `QueryCacheEvictorListener` and `SHARED_CACHE_CONTEXT`, the `AnalyticsTracked` event (STA-1512), nothing else is, the ports are not,
 *          and the template's types (`ActionContext`, `ExtensionClass`, `ExtensionContext`, `ExtensionTable`,
 *          `PreconditionContext`, `QueryContext`) and the offline option and replica types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { Effect } from "#contracts/index";
import * as actions from "#core/index";
import type {
  ActionAccepts,
  ActionContext,
  ActionEffects,
  AnySlot,
  CallInput,
  CallOptions,
  ExtensionClass,
  ExtensionContext,
  ExtensionTable,
  InputOf,
  OfflineCap,
  OfflineOptions,
  OutputOf,
  PreconditionContext,
  QueryContext,
  QueryOptions,
  QueryReplica,
  RawBody,
  ReplicaBounds,
  ReplicaPage,
  RuleEvaluation,
  RuleEvaluator,
} from "#core/index";

describe("@stackra/actions", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(actions).sort()).toEqual([
      "Action",
      "ActionPipeline",
      "AnalyticsTracked",
      "ApprovalRequiredError",
      "AuditEntryRecorded",
      "CacheScope",
      "ConflictResolution",
      "DeviceSequenceOutOfOrderError",
      "Extension",
      "ExtensionPoint",
      "IdMinting",
      "Idempotency",
      "IdempotencyKeyRequiredError",
      "InputInvalidError",
      "Interceptor",
      "MemoryDeviceSequenceStoreDriver",
      "MemoryIdempotencyStoreDriver",
      "MemoryOfflineCapStoreDriver",
      "MemoryRateLimitStoreDriver",
      "MemoryReplicaLogDriver",
      "MemoryReviewItemSinkDriver",
      "OfflineCapReachedError",
      "OfflineMode",
      "OfflinePrecondition",
      "OpenApprovalGateDriver",
      "OutboxAuditTrailDriver",
      "PipelineStage",
      "Precondition",
      "Query",
      "QueryCacheEvictorListener",
      "RateLimitConfig",
      "RateLimitConfig$",
      "ReplicaFeed",
      "RequestContext",
      "SHARED_CACHE_CONTEXT",
      "StoresConfig",
      "StoresConfig$",
      "StoresOptions",
      "UsageRecorded",
      "approverRefusal",
      "connectExtensions",
      "isRawBody",
      "rawBody",
      "registerActions",
      "registerCachedQueries",
      "registerExtensions",
    ]);
    expect("IdempotencyStore" in actions).toBe(false);
    expect("AsyncContextStorageDriver" in actions).toBe(false);
  });

  it("resolves the template's types", () => {
    expectTypeOf<ExtensionContext["actor"]>().toEqualTypeOf<Actor>();
    expectTypeOf<ExtensionContext["now"]>().returns.toEqualTypeOf<Date>();
    expectTypeOf<PreconditionContext>().toEqualTypeOf<ExtensionContext>();
    expectTypeOf<QueryContext>().toMatchTypeOf<ExtensionContext>();
    expectTypeOf<ActionContext>().toMatchTypeOf<QueryContext>();
    expectTypeOf<ActionContext["idempotencyKey"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ExtensionTable[string]["kind"]>().toEqualTypeOf<"after" | "before">();
    // the called form returns the exported `ExtensionClass`, so a consumer's declaration emit can name it (STA-1220)
    expectTypeOf(actions.Extension<AnySlot>({ order: 1 })).toEqualTypeOf<ExtensionClass<AnySlot>>();
    type Handler = {
      handle: (input: { orderId: string }, ctx: QueryContext) => Promise<{ status: string }>;
    };
    expectTypeOf<InputOf<Handler>>().toEqualTypeOf<{ orderId: string }>();
    expectTypeOf<CallInput<Handler>>().toEqualTypeOf<{ orderId: string }>();
    expectTypeOf<OutputOf<Handler>>().toEqualTypeOf<{ status: string }>();
    expectTypeOf<OfflineOptions["cap"]>().toEqualTypeOf<OfflineCap | undefined>();
    expectTypeOf<QueryOptions["replica"]>().toEqualTypeOf<QueryReplica | undefined>();
    expectTypeOf<ActionAccepts["ruleVersion"]>().toEqualTypeOf<string>();
    expectTypeOf<NonNullable<CallOptions["device"]>["sequence"]>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<QueryContext["deviceId"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<ReplicaBounds["since"]>().toEqualTypeOf<Date>();
    expectTypeOf<ReplicaPage["removed"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<ReplicaPage["full"]>().toEqualTypeOf<boolean>();
    expectTypeOf<RuleEvaluation["ruleVersion"]>().toEqualTypeOf<string>();
    expectTypeOf<ReturnType<RuleEvaluator<unknown>["evaluate"]>>().toEqualTypeOf<
      Promise<RuleEvaluation | undefined>
    >();
    expectTypeOf<QueryContext["replica"]>().toBeFunction();
    expectTypeOf<ActionEffects[number]>().toEqualTypeOf<Effect>();
    expectTypeOf<RawBody["~raw"]>().toEqualTypeOf<true>();
    expectTypeOf<QueryContext["sandbox"]>().toEqualTypeOf<true | undefined>();
    expectTypeOf<CallOptions["client"]>().toEqualTypeOf<
      { readonly address: string; readonly userAgent?: string } | undefined
    >();
  });
});

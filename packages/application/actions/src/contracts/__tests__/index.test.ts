/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the fifteen ports of the pipeline's steps and stores and
 *          the `ReviewReason` enum are exported, nothing else is as a value, and the exchanged types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor, Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  AuditEntry,
  CallDescriptor,
  DeviceOrder,
  DeviceSequence,
  IdempotencyRecord,
  OfflineCapUsage,
  RateLimitBucket,
  RateLimitDecision,
  ReplicaChange,
  ReplicaRead,
  ReviewItem,
  ReviewReason,
} from "#contracts/index";

describe("@stackra/actions/contracts", () => {
  it("exports exactly its ports and its enum", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AccessControl",
      "AuditTrail",
      "ContextStorage",
      "DeviceSequenceStore",
      "EntitlementCheck",
      "FlagCheck",
      "IdempotencyStore",
      "JobDispatcher",
      "OfflineCapStore",
      "RateLimitStore",
      "ReplicaLog",
      "ReviewItemSink",
      "ReviewReason",
      "TenancyCheck",
      "UnitOfWork",
      "WorkflowRunner",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<CallDescriptor["actor"]>().toEqualTypeOf<Actor>();
    expectTypeOf<CallDescriptor["kind"]>().toEqualTypeOf<"action" | "query">();
    expectTypeOf<AuditEntry["fields"]>().toEqualTypeOf<Readonly<Record<string, Json>>>();
    expectTypeOf<AuditEntry["outcome"]>().toEqualTypeOf<"ok" | "refused">();
    expectTypeOf<IdempotencyRecord["fingerprint"]>().toEqualTypeOf<string>();
    expectTypeOf<Extract<IdempotencyRecord, { done: true }>["output"]>().toEqualTypeOf<unknown>();
    expectTypeOf<RateLimitBucket["tokensPerSecond"]>().toEqualTypeOf<number>();
    expectTypeOf<RateLimitDecision["allowed"]>().toEqualTypeOf<boolean>();
    expectTypeOf<DeviceOrder["sequence"]>().toEqualTypeOf<number>();
    expectTypeOf<DeviceSequence["settledAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<OfflineCapUsage["amount"]>().toEqualTypeOf<number>();
    expectTypeOf<ReplicaChange<{ total: number }>["row"]>().toEqualTypeOf<
      { total: number } | undefined
    >();
    expectTypeOf<ReplicaRead["more"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ReviewItem["reason"]>().toEqualTypeOf<ReviewReason>();
    expectTypeOf<ReviewItem["client"]>().toEqualTypeOf<Json>();
  });
});

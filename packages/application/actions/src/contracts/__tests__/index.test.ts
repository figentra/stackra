/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the twenty-one ports of the pipeline's steps and stores and
 *          the `ReviewReason`, `Effect`, `ApproverRefusal` and `CallOriginKind` enums are exported, nothing else is as a value,
 *          and the exchanged types resolve (`AssuranceLevel` is @stackra/contracts', STA-1383).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor, AssuranceLevel, Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  AuditEntry,
  CallAssurance,
  CallClient,
  CallDescriptor,
  CallOrigin,
  CallOriginKind,
  DeviceOrder,
  DeviceSequence,
  IdempotencyRecord,
  OfflineCapUsage,
  RateLimitBucket,
  RateLimitDecision,
  ReplicaChange,
  ReplicaRead,
  ReplicaRow,
  ReviewItem,
  ReviewReason,
} from "#contracts/index";

describe("@stackra/actions/contracts", () => {
  it("exports exactly its ports and its enum", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AccessControl",
      "ApprovalGate",
      "ApproverRefusal",
      "AuditTrail",
      "CallOriginKind",
      "ContextStorage",
      "DeviceSequenceStore",
      "Effect",
      "EntitlementCheck",
      "FlagCheck",
      "IdempotencyStore",
      "JobDispatcher",
      "LimitReservation",
      "LiveConfigurationGuard",
      "OfflineCapStore",
      "RateLimitBudget",
      "RateLimitStore",
      "ReplicaLog",
      "ReviewItemSink",
      "ReviewReason",
      "StepUpCheck",
      "TenancyCheck",
      "UnitOfWork",
      "WorkflowRunner",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<CallDescriptor["actor"]>().toEqualTypeOf<Actor>();
    expectTypeOf<CallDescriptor["kind"]>().toEqualTypeOf<"action" | "query">();
    expectTypeOf<CallDescriptor["origin"]>().toEqualTypeOf<CallOrigin | undefined>();
    expectTypeOf<CallOrigin["kind"]>().toEqualTypeOf<CallOriginKind>();
    expectTypeOf<AuditEntry["fields"]>().toEqualTypeOf<Readonly<Record<string, Json>>>();
    expectTypeOf<AuditEntry["outcome"]>().toEqualTypeOf<"ok" | "refused">();
    expectTypeOf<IdempotencyRecord["fingerprint"]>().toEqualTypeOf<string>();
    expectTypeOf<Extract<IdempotencyRecord, { done: true }>["output"]>().toEqualTypeOf<unknown>();
    expectTypeOf<RateLimitBucket["tokensPerSecond"]>().toEqualTypeOf<number>();
    expectTypeOf<RateLimitDecision["allowed"]>().toEqualTypeOf<boolean>();
    expectTypeOf<DeviceOrder["sequence"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<DeviceSequence["settledAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<OfflineCapUsage["amount"]>().toEqualTypeOf<number>();
    expectTypeOf<ReplicaChange["row"]>().toEqualTypeOf<ReplicaRow | undefined>();
    expectTypeOf<ReplicaRow["at"]>().toEqualTypeOf<Date>();
    expectTypeOf<ReplicaRead["more"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ReviewItem["reason"]>().toEqualTypeOf<ReviewReason>();
    expectTypeOf<ReviewItem["client"]>().toEqualTypeOf<Json>();
    expectTypeOf<CallAssurance["level"]>().toEqualTypeOf<AssuranceLevel | undefined>();
    expectTypeOf<CallAssurance["authTime"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<CallClient["userAgent"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CallDescriptor["sandbox"]>().toEqualTypeOf<true | undefined>();
  });
});

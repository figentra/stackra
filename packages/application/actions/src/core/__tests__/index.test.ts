/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/actions` (`Action`,
 *          `ConflictResolution`, `Extension`, `ExtensionPoint`, `IdMinting`, `Idempotency`, `OfflineMode`,
 *          `OfflinePrecondition`, `Precondition`, `Query`, `RateLimitConfig`, `RateLimitConfig$`, `RequestContext`)
 *          and the registry row's runtime are exported, nothing else is, the ports are not, and the template's types
 *          (`ActionContext`, `ExtensionContext`, `ExtensionTable`, `PreconditionContext`, `QueryContext`) resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Actor } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as actions from "#core/index";
import type {
  ActionContext,
  CallInput,
  ExtensionContext,
  ExtensionTable,
  InputOf,
  OutputOf,
  PreconditionContext,
  QueryContext,
} from "#core/index";

describe("@stackra/actions", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(actions).sort()).toEqual([
      "Action",
      "ActionPipeline",
      "ConflictResolution",
      "Extension",
      "ExtensionPoint",
      "IdMinting",
      "Idempotency",
      "IdempotencyKeyRequiredError",
      "InputInvalidError",
      "Interceptor",
      "MemoryIdempotencyStoreDriver",
      "MemoryRateLimitStoreDriver",
      "OfflineMode",
      "OfflinePrecondition",
      "PipelineStage",
      "Precondition",
      "Query",
      "RateLimitConfig",
      "RateLimitConfig$",
      "RequestContext",
      "connectExtensions",
      "registerActions",
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
    type Handler = {
      handle(input: { orderId: string }, ctx: QueryContext): Promise<{ status: string }>;
    };
    expectTypeOf<InputOf<Handler>>().toEqualTypeOf<{ orderId: string }>();
    expectTypeOf<CallInput<Handler>>().toEqualTypeOf<{ orderId: string }>();
    expectTypeOf<OutputOf<Handler>>().toEqualTypeOf<{ status: string }>();
  });
});

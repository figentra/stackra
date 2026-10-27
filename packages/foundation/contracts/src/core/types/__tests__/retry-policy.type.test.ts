/**
 * Stackra file contract:
 * Purpose: type tests of `RetryPolicy`: exactly its seven fields, `attempts` required and the rest optional, each
 *          typed by its contract (`Duration`, `Backoff`, `Jitter`, `RetryOn`).
 * Boundary: test only; the exact-set check fails when a field is added or removed without updating this test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; owner D10 2026-10-28 (stackra-223).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Duration } from "#core/constants/duration.constant";
import { Backoff } from "#core/enums/backoff.enum";
import { Jitter } from "#core/enums/jitter.enum";
import { RetryOn } from "#core/enums/retry-on.enum";
import type { RetryPolicy } from "#core/types/retry-policy.type";

describe("RetryPolicy", () => {
  it("has exactly these fields", () => {
    expectTypeOf<keyof RetryPolicy>().toEqualTypeOf<
      "attempts" | "base" | "max" | "backoff" | "multiplier" | "jitter" | "retryOn"
    >();
    expectTypeOf<RetryPolicy["attempts"]>().toEqualTypeOf<number>();
    expectTypeOf<RetryPolicy["base"]>().toEqualTypeOf<Duration | undefined>();
    expectTypeOf<RetryPolicy["max"]>().toEqualTypeOf<Duration | undefined>();
    expectTypeOf<RetryPolicy["backoff"]>().toEqualTypeOf<Backoff | undefined>();
    expectTypeOf<RetryPolicy["multiplier"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<RetryPolicy["jitter"]>().toEqualTypeOf<Jitter | undefined>();
    expectTypeOf<RetryPolicy["retryOn"]>().toEqualTypeOf<RetryOn | undefined>();
  });

  it("takes only attempts, or every field", () => {
    const least: RetryPolicy = { attempts: 3 };
    const full: RetryPolicy = {
      attempts: 5,
      base: Duration.parse("200ms"),
      max: Duration.seconds(30),
      backoff: Backoff.Linear,
      multiplier: 2,
      jitter: Jitter.Equal,
      retryOn: RetryOn.Network,
    };
    // @ts-expect-error -- attempts is required
    const none: RetryPolicy = {};
    expect([least.attempts, full.base, none]).toEqual([3, "PT0.2S", {}]);
  });
});

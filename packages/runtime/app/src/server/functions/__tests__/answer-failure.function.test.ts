/**
 * Stackra file contract:
 * Purpose: unit tests of `answerFailure`: a refusal answers its kind's status and envelope and is never reported; any
 *          other thrown value is reported once with the correlation id and answered 500 with the `internal` envelope,
 *          which says nothing of the error; a refusal whose envelope cannot be written is reported and answered 500; a
 *          throwing reporter still gets the client its answer.
 * Boundary: test only; the memory `ErrorReporter` of @stackra/errors.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140 (decisions 1 to 3); ADR 0232 (decision 8).
 */
import { ErrorKind, MemoryErrorReporterDriver, Refusal } from "@stackra/errors";
import { ErrorReporter } from "@stackra/errors/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AppDrainingError } from "#server/errors/app-draining.error";
import { answerFailure } from "#server/functions/answer-failure.function";

class OrderLockedError extends Refusal({ kind: ErrorKind.Conflict }) {}

class LedgerRefusedError extends Refusal({ kind: ErrorKind.Conflict }) {
  total!: bigint;
}

const INTERNAL = {
  code: "internal",
  category: "internal",
  retryable: false,
  correlationId: "req-1",
};

describe(answerFailure, () => {
  it("answers a refusal with its kind's status and envelope, unreported", async () => {
    const reporter = new MemoryErrorReporterDriver();
    const locked = answerFailure(OrderLockedError.create(), { correlationId: "req-1", reporter });
    expect(locked.status).toBe(409);
    expect(await locked.json()).toEqual({
      code: "order_locked",
      category: "conflict",
      retryable: false,
      correlationId: "req-1",
    });
    const draining = answerFailure(AppDrainingError.create(), { correlationId: "req-1", reporter });
    expect(draining.status).toBe(503);
    expect(await draining.json()).toMatchObject({ code: "app_draining", retryable: true });
    expect(reporter.errors).toEqual([]);
  });

  it("reports anything else once with the correlation id and answers the internal envelope", async () => {
    const reporter = new MemoryErrorReporterDriver();
    const crash = new Error("AccessControl is not bound: password=hunter2");
    const response = answerFailure(crash, { correlationId: "req-1", reporter });
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual(INTERNAL);
    expect(body).not.toContain("AccessControl");
    expect(reporter.errors).toEqual([crash]);
    expect(reporter.contexts).toEqual([{ correlationId: "req-1" }]);
    expect(answerFailure("thrown string", { correlationId: "req-1", reporter }).status).toBe(500);
    expect(reporter.errors).toHaveLength(2);
  });

  it("reports and answers 500 for a refusal whose envelope cannot be written", async () => {
    const reporter = new MemoryErrorReporterDriver();
    const refusal = LedgerRefusedError.create({ total: 1n });
    const response = answerFailure(refusal, { correlationId: "req-1", reporter });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(INTERNAL);
    expect(reporter.errors).toEqual([refusal]);
  });

  it("answers even when the reporter throws", async () => {
    class BrokenReporter extends ErrorReporter {
      report(): void {
        throw new Error("reporter down");
      }
    }
    const response = answerFailure(new Error("boom"), {
      correlationId: "req-1",
      reporter: new BrokenReporter(),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(INTERNAL);
  });
});

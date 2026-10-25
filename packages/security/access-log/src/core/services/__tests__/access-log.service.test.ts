/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogService`: a record names the principal a call is for by default and the named field
 *          of every record among the arguments and the result otherwise; nothing is written when no subject was
 *          touched; a failing sink is logged as `access_log_write_failed` and never reaches the caller.
 * Boundary: test only; the service is built with the package's sink fake, a fixed clock and a logger fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 5 and open question 1); ADR 0134.
 */
import { ActorKind, Clock, DataClassification, Logger, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, Fake, it } from "@stackra/testing";

import { ACCESS_LOG_WRITE_FAILED } from "#core/constants/access-log-write-failed.constant";
import { AccessLogService } from "#core/services/access-log.service";
import { AccessLogSinkFake } from "#testing/access-log-sink.fake";

const AT = new Date("2026-10-24T08:00:00Z");

/** Always the same instant. */
class FixedClock extends Clock {
  now(): Date {
    return new Date(AT.getTime());
  }
}

/** Records every log line. */
class LoggerFake extends Fake.of(Logger) {}

const STAFF: Actor = { kind: ActorKind.User, id: "usr_staff", realm: Realm.Platform };

/** The service over `sink`, with the logger it reports to. */
function serviceWith(sink: AccessLogSinkFake): { service: AccessLogService; logger: LoggerFake } {
  const logger = new LoggerFake();
  return { service: new AccessLogService(sink, logger, new FixedClock()), logger };
}

describe("AccessLogService", () => {
  it("names the principal the call is for when the facet names no field", async () => {
    const sink = AccessLogSinkFake.with();
    const relay: Actor = {
      kind: ActorKind.Service,
      id: "svc_notifications",
      onBehalfOf: { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer },
    };

    await serviceWith(sink).service.record(
      "call_1",
      relay,
      "Reads.view",
      { classification: DataClassification.Personal },
      [],
    );

    expect(sink.calls("write")).toEqual([
      {
        callId: "call_1",
        actor: relay,
        target: "Reads.view",
        classification: DataClassification.Personal,
        subjects: ["usr_1"],
        at: AT,
      },
    ]);
  });

  it("names the field of every record the call handled, or writes nothing", async () => {
    const sink = AccessLogSinkFake.with();
    const { service } = serviceWith(sink);
    const options = {
      classification: DataClassification.Pseudonymous,
      subjects: "customerId",
    } as const;

    await service.record("call_1", STAFF, "Orders.find", options, [
      "ord_1",
      [{ customerId: "usr_1" }, { customerId: "usr_2" }, { customerId: "usr_1" }],
    ]);
    await service.record("call_2", STAFF, "Orders.attach", options, ["ord_1", "pay_1", null]);

    expect(sink.calls("write").map((record) => record.subjects)).toEqual([["usr_1", "usr_2"]]);
  });

  it("logs a sink failure and never rejects", async () => {
    const { service, logger } = serviceWith(AccessLogSinkFake.with({ failing: true }));

    await expect(
      service.record(
        "call_1",
        STAFF,
        "Reads.view",
        { classification: DataClassification.Health },
        [],
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      ACCESS_LOG_WRITE_FAILED,
      expect.objectContaining({ callId: "call_1", target: "Reads.view" }),
    );
  });
});

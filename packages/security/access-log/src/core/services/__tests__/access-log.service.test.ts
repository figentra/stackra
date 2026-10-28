/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogService`: a record names the principal a call is for by default and the named field
 *          of every record among the arguments and the result otherwise; nothing is written when no subject was
 *          touched; a failing sink is logged as `access_log_write_failed` and reaches the caller only for a class that
 *          fails closed: a configured classification (financial, health and regulated by default) or a `failClosed` facet.
 * Boundary: test only; the service is built with the package's sink fake, a fixed clock and a logger fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 5 and open question 1); ADR 0134; ADR 0409 (STA-821).
 */
import { buildConfig } from "@stackra/config";
import { ActorKind, Clock, DataClassification, Logger, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, Fake, it } from "@stackra/testing";

import { AccessLogConfig } from "#config/access-log.config";
import { ACCESS_LOG_WRITE_FAILED } from "#core/constants/access-log-write-failed.constant";
import { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";
import { AccessLogService } from "#core/services/access-log.service";
import { AccessLogSinkFake } from "#testing/access-log-sink.fake";

const AT = new Date("2026-10-24T08:00:00Z");

/** Always the same instant. */
class FixedClock extends Clock {
  now(): Date {
    return new Date(AT);
  }
}

/** Records every log line; the methods are left to the spies (`declare` satisfies the abstract members). */
class LoggerFake extends Fake.of(Logger) {
  declare debug: Logger["debug"];

  declare info: Logger["info"];

  declare warn: Logger["warn"];

  declare error: Logger["error"];
}

const STAFF: Actor = { kind: ActorKind.User, id: "usr_staff", realm: Realm.Platform };

/** The service over `sink` with the default configuration (or `failClosed`), and the logger it reports to. */
function serviceWith(
  sink: AccessLogSinkFake,
  failClosed?: DataClassification[],
): { service: AccessLogService; logger: LoggerFake } {
  const logger = new LoggerFake();
  const config = buildConfig(
    AccessLogConfig,
    failClosed === undefined ? {} : { values: { failClosed } },
  );
  return { service: new AccessLogService(sink, logger, new FixedClock(), config), logger };
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

  it("logs a sink failure and serves a class that fails open", async () => {
    const { service, logger } = serviceWith(AccessLogSinkFake.with({ failing: true }));

    await expect(
      service.record(
        "call_1",
        STAFF,
        "Reads.view",
        { classification: DataClassification.Personal },
        [],
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      ACCESS_LOG_WRITE_FAILED,
      expect.objectContaining({ callId: "call_1", target: "Reads.view" }),
    );
  });

  it("refuses a financial, health or regulated read whose record is lost, after logging it (STA-821, STA-1300)", async () => {
    const { service, logger } = serviceWith(AccessLogSinkFake.with({ failing: true }));
    for (const classification of [
      DataClassification.Financial,
      DataClassification.Health,
      DataClassification.Regulated,
    ])
      await expect(
        service.record("call_2", STAFF, "Wallets.view", { classification }, []),
      ).rejects.toBeInstanceOf(AccessLogWriteFailedError);
    expect(logger.error).toHaveBeenCalledWith(
      ACCESS_LOG_WRITE_FAILED,
      expect.objectContaining({ callId: "call_2", target: "Wallets.view" }),
    );
  });

  it("fails a privileged facet closed whatever its class, and follows the configured list", async () => {
    const failing = AccessLogSinkFake.with({ failing: true });
    const { service } = serviceWith(failing);
    await expect(
      service.record(
        "call_3",
        STAFF,
        "Impersonation.view",
        { classification: DataClassification.Pseudonymous, failClosed: true },
        [],
      ),
    ).rejects.toBeInstanceOf(AccessLogWriteFailedError);
    const open = serviceWith(failing, []).service;
    await expect(
      open.record(
        "call_4",
        STAFF,
        "Wallets.view",
        { classification: DataClassification.Financial },
        [],
      ),
    ).resolves.toBeUndefined();
    expect(open.failsClosed({ classification: DataClassification.Financial })).toBe(false);
  });
});

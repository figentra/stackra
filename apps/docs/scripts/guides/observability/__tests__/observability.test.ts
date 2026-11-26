/**
 * Stackra file contract:
 * Purpose: the tests of the "Observability" guide's examples, over the logger package's real OTLP drivers and a
 *          collector double: triaging a ticket sends one `support.triage` span with its ids and queue, a counter and a
 *          histogram, and one log line; a personal field logged by mistake reaches the collector masked; and `/readyz`
 *          of a host booted by `createApp` answers 200 while the mailbox answers and 503 naming `support_mailbox`
 *          when it does not, with no detail in the body.
 * Boundary: test only; `fetch` is the collector double, the mailbox a stand-in driver, the OTLP endpoint a test host.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0147 (decision 3); ADR 0184; STA-2852.
 */
import { createApp } from "@stackra/app/server";
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { Driver, Module, SystemClockDriver, type Wiring } from "@stackra/container";
import {
  ChannelLoggerDriver,
  LoggingConfig,
  OtlpConfig,
  OtlpLogReporterDriver,
  OtlpMetricsDriver,
  OtlpTracerDriver,
} from "@stackra/logger";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SupportMailbox } from "../support-mailbox.port";
import { SupportMailboxHealthIndicatorDriver } from "../support-mailbox-health-indicator.driver";
import { TicketTriageService } from "../ticket-triage.service";
import { fakeCollector } from "./collector";

const TICKET = "tkt_01j9z3k4m5n6p7q8r9s0t1v2t1";

let collector: ReturnType<typeof fakeCollector>;

beforeEach(() => {
  collector = fakeCollector();
  vi.stubGlobal("fetch", collector.fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The three OTLP drivers a deployed service binds, pointed at the test collector. */
function telemetry() {
  // #region drivers
  const otlp = buildConfig(OtlpConfig, {
    values: { endpoint: "https://otel.support.example", serviceName: "support" },
  });
  const secrets = new MemorySecretStoreDriver(); // OTEL_EXPORTER_OTLP_HEADERS, when the collector needs them
  const reporter = new OtlpLogReporterDriver(otlp, secrets);
  const logger = new ChannelLoggerDriver(
    buildConfig(LoggingConfig),
    reporter,
    new SystemClockDriver(),
  );
  const metrics = new OtlpMetricsDriver(otlp, secrets);
  const tracer = new OtlpTracerDriver(otlp, secrets);
  // #endregion drivers
  const flush = () => Promise.all([reporter.flush(), metrics.flush(), tracer.flush()]);
  return { logger, metrics, tracer, flush };
}

/** A mailbox that answers while `up`. */
class StandInMailboxDriver extends Driver(SupportMailbox) {
  static up = true;

  async ping(): Promise<void> {
    if (!StandInMailboxDriver.up) throw new TypeError("connection refused");
  }
}

class SupportModule extends Module({}) {}

describe("Observability guide", () => {
  it("sends one span, two metrics and one log line for a triage", async () => {
    const { logger, metrics, tracer, flush } = telemetry();
    // #region triage
    const triage = new TicketTriageService(logger, metrics, tracer);
    expect(await triage.triage(TICKET, "urgent")).toBe("on_call");
    await flush(); // a request's end, or shutdown, flushes in a deployed service

    expect(collector.spans()).toEqual([
      {
        name: "support.triage",
        attributes: { ticketId: TICKET, priority: "urgent", queue: "on_call" },
      },
    ]);
    expect(collector.metrics()).toMatchObject({
      "support.tickets_triaged": 1,
      "support.triage_ms": 0,
    });
    expect(collector.logs()).toEqual([
      {
        event: "support.ticket_triaged",
        fields: { "log.channel": "support", ticketId: TICKET, queue: "on_call" },
      },
    ]);
    // #endregion triage
  });

  it("masks a personal field logged by mistake before it leaves the process", async () => {
    const { logger, flush } = telemetry();
    // #region redaction
    logger.warn("support.reply_bounced", { ticketId: TICKET, customerEmail: "ada@example.com" });
    await flush();

    const [line] = collector.logs();
    expect(line?.fields["ticketId"]).toBe(TICKET);
    expect(line?.fields["customerEmail"]).not.toBe("ada@example.com");
    expect(JSON.stringify(collector.logs())).not.toContain("ada@example.com");
    // #endregion redaction
  });

  it("reports the mailbox on /readyz, and fails readiness when it is down", async () => {
    StandInMailboxDriver.up = true;
    const wiring: Wiring = {
      member: "support",
      root: SupportModule,
      modules: { support: { exports: [], dependsOn: [], type: SupportModule } },
    };
    // #region readiness
    const mailbox = new StandInMailboxDriver();
    const app = await createApp(SupportModule, {
      wiring,
      health: [new SupportMailboxHealthIndicatorDriver(mailbox)],
    });

    expect(await app.probe("GET", "/readyz")).toEqual({
      status: 200,
      body: { support_mailbox: "up" },
    });

    StandInMailboxDriver.up = false;
    expect(await app.probe("GET", "/readyz")).toEqual({
      status: 503,
      body: { support_mailbox: "down" },
    });
    // #endregion readiness
    await app.close();
  });
});

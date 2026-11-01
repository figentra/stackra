/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditTrailCommandAuditDriver`: it is the `CommandAudit` port, hands the write audit an entry
 *          keyed `console.<command>` in the configured operations tenant with the operator, values and exit code as
 *          fields, stores a failed run as refused, refuses when no operations tenant is set, and refuses an audited
 *          console command when no `CommandAudit` is bound.
 * Boundary: test only; the `AuditTrail` is an in-memory stand-in, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1731 spec FR-015 to FR-017.
 */
// @covers sta-1731:FR-015 sta-1731:FR-016 sta-1731:FR-017
import type { AuditEntry, AuditTrail } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Command } from "@stackra/console";
import { CommandAudit } from "@stackra/console/contracts";
import type { CommandAuditEntry } from "@stackra/console/contracts";
import { runCommandForTest } from "@stackra/console/testing";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogConfig } from "#config/access-log.config";
import { CommandAuditScopeMissingError } from "#core/errors/command-audit-scope-missing.error";
import { AuditTrailCommandAuditDriver } from "#node/drivers/audit-trail-command-audit.driver";

const SCOPE = "scp_01j9z3k4m5n6p7q8r9s0t1v2o1";

const entry: CommandAuditEntry = {
  operator: "ada",
  command: "db:migrate",
  values: { env: "dev", token: "[redacted]" },
  at: new Date("2026-11-01T09:00:00Z"),
  outcome: "ok",
  exitCode: 0,
};

/** The driver over a recording trail and a config with `commandAuditScope`. */
function driverWith(commandAuditScope: string) {
  const recorded: AuditEntry[] = [];
  const trail = {
    record: async (item: AuditEntry) => {
      recorded.push(item);
    },
  } as unknown as AuditTrail;
  const config = buildConfig(AccessLogConfig, { values: { commandAuditScope } });
  return { driver: new AuditTrailCommandAuditDriver(trail, config), recorded };
}

/** An audited command that does nothing. */
/** Whether `PingCommand`'s handler ran. */
let pinged = false;

class PingCommand extends Command({
  name: "ping",
  description: "Ping",
  audit: true,
}) {
  /** Records that it ran. */
  handle(): void {
    pinged = true;
  }
}

describe("AuditTrailCommandAuditDriver", () => {
  it("is a CommandAudit", () => {
    expect(driverWith(SCOPE).driver).toBeInstanceOf(CommandAudit);
  });

  it("stores the run in the operations tenant's chain", async () => {
    const { driver, recorded } = driverWith(SCOPE);
    await driver.record(entry);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      call: { key: "console.db:migrate", actor: { id: "svc_console", scopeId: SCOPE } },
      at: entry.at,
      outcome: "ok",
      fields: {
        operator: "ada",
        command: "db:migrate",
        values: { env: "dev", token: "[redacted]" },
        exitCode: 0,
        outcome: "ok",
      },
    });
  });

  it("stores a failed run as refused with its outcome as the code", async () => {
    const { driver, recorded } = driverWith(SCOPE);
    await driver.record({ ...entry, outcome: "failed", exitCode: 1 });
    expect(recorded[0]).toMatchObject({ outcome: "refused", code: "failed" });
  });

  it("refuses when no operations tenant is configured", async () => {
    const { driver, recorded } = driverWith("");
    const refused = await driver.record(entry).catch((error: unknown) => error);
    expect(isRefusal(refused, CommandAuditScopeMissingError)).toBe(true);
    expect(recorded).toHaveLength(0);
  });

  it("refuses the run before its handler when no operations tenant is configured", async () => {
    pinged = false;
    const { driver, recorded } = driverWith("");
    const result = await runCommandForTest([PingCommand], ["ping"], { audit: driver });
    expect(result.exitCode).toBe(1);
    expect(pinged).toBe(false);
    expect(recorded).toHaveLength(0);
  });

  it("lets a run through only when a CommandAudit is bound", async () => {
    const { driver, recorded } = driverWith(SCOPE);
    const unbound = await runCommandForTest([PingCommand], ["ping"]);
    expect(unbound.exitCode).toBe(1);
    expect(unbound.stderr).toContain("CommandAudit");
    const bound = await runCommandForTest([PingCommand], ["ping"], { audit: driver });
    expect(bound.exitCode).toBe(0);
    expect(recorded[0]?.call.key).toBe("console.ping");
  });
});

/**
 * Stackra file contract:
 * Purpose: proves an audited command records one entry per run with its operator, values and outcome; is refused
 *          before its handler with no `CommandAudit`; never keeps a secret value; and fails when the record fails.
 * Boundary: unit test through the testing harness.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-015 to FR-017; ADR 0022 (test placement).
 */
// @covers sta-1731:FR-015 sta-1731:FR-016 sta-1731:FR-017 sta-1731:FR-018
import { Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Argument } from "#core/decorators/argument.decorator";
import { Option } from "#core/decorators/option.decorator";
import { auditValues } from "#core/functions/audit-values.function";
import { readCommand } from "#core/functions/read-command.function";
import { MemoryCommandAuditDriver } from "#testing/drivers/memory-command-audit.driver";
import { MemoryOperatorBreakGlassDriver } from "#testing/drivers/memory-operator-break-glass.driver";
import { runCommandForTest } from "#testing/functions/run-command-for-test.function";

/** Records whether its handler ran. */
let ran = false;

class SeedCommand extends Command({
  name: "acct:seed",
  description: "Seed",
  audit: true,
}) {
  @Argument
  @Str
  slug = "";

  @Option({ secret: true })
  @Str
  pin = "";

  @Option
  @Str
  apiKey = "";

  @Option
  fail = false;

  handle(): number {
    ran = true;
    return this.fail ? 3 : 0;
  }
}

class ShortPinCommand extends Command({
  name: "acct:pin",
  description: "Pin",
  audit: true,
}) {
  @Option({ secret: true })
  @Str({ min: 4 })
  pin = "0000";

  handle(): number {
    return 0;
  }
}

describe("command audit", () => {
  beforeEach(() => {
    ran = false;
  });

  it("records one entry with the operator, the values and the outcome", async () => {
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme", "--pin", "1234"], {
      audit,
      env: { STACKRA_OPERATOR: "ada" },
    });
    expect(result.exitCode).toBe(0);
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      operator: "ada",
      command: "acct:seed",
      values: { slug: "acme", pin: "[redacted]", "api-key": "[redacted]", fail: false },
      outcome: "ok",
      exitCode: 0,
    });
  });

  it("records a failed run with its exit code", async () => {
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme", "--fail"], {
      audit,
      env: { USER: "grace" },
    });
    expect(result.exitCode).toBe(3);
    expect(audit.entries[0]).toMatchObject({ operator: "grace", outcome: "failed", exitCode: 3 });
  });

  it("refuses the run before the handler when no CommandAudit is bound", async () => {
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"]);
    expect(result.exitCode).toBe(1);
    expect(ran).toBe(false);
    expect(result.stderr).toContain("no CommandAudit is bound");
  });

  it("fails a successful run whose entry cannot be written", async () => {
    const audit = new MemoryCommandAuditDriver().failWith(new Error("sink down"));
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], { audit });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("sink down");
  });

  it("never writes a secret value to the entry or to --json", async () => {
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest(
      [SeedCommand],
      ["acct:seed", "acme", "--pin", "9876", "--api-key", "k-123", "--json"],
      { audit },
    );
    expect(JSON.stringify(audit.entries)).not.toMatch(/9876|k-123/);
    expect(result.stdout).not.toMatch(/9876|k-123/);
  });

  it("refuses the run before the handler when the sink is not ready", async () => {
    const audit = new MemoryCommandAuditDriver().notReady(new Error("no operations scope"));
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], { audit });
    expect(result.exitCode).toBe(1);
    expect(ran).toBe(false);
    expect(audit.entries).toHaveLength(0);
    expect(result.stderr).toContain("no operations scope");
  });

  it("says a failed run was not audited when its entry cannot be written", async () => {
    const audit = new MemoryCommandAuditDriver().failWith(new Error("sink down"));
    const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme", "--fail"], {
      audit,
    });
    expect(result.exitCode).toBe(3);
    expect(result.stderr).toContain("NOT audited");
  });

  it("never echoes a secret value in a usage error", async () => {
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest(
      [ShortPinCommand],
      ["acct:pin", "--pin", "12", "--json"],
      { audit },
    );
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("[redacted]");
    expect(result.stdout + result.stderr).not.toContain('"12"');
  });

  describe("in production", () => {
    const PRODUCTION = { STACKRA_ENVIRONMENT: "production", STACKRA_OPERATOR: "ada" };

    it("refuses an audited run before its handler with no break-glass binding", async () => {
      const audit = new MemoryCommandAuditDriver();
      const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], {
        audit,
        env: PRODUCTION,
      });
      expect(result.exitCode).toBe(1);
      expect(ran).toBe(false);
      expect(result.stderr).toContain("no OperatorBreakGlass is bound");
    });

    it("refuses when the operator has no open session, or only one that has ended", async () => {
      const audit = new MemoryCommandAuditDriver();
      for (const breakGlass of [
        new MemoryOperatorBreakGlassDriver(),
        new MemoryOperatorBreakGlassDriver().open("ada", -1000),
        new MemoryOperatorBreakGlassDriver().open("grace", 60_000),
      ]) {
        const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], {
          audit,
          breakGlass,
          env: PRODUCTION,
        });
        expect(result.exitCode).toBe(1);
      }
      expect(ran).toBe(false);
      expect(audit.entries).toHaveLength(0);
    });

    it("runs inside an open session and records its id", async () => {
      const audit = new MemoryCommandAuditDriver();
      const breakGlass = new MemoryOperatorBreakGlassDriver().open("ada", 60_000, "incident 42");
      const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], {
        audit,
        breakGlass,
        env: PRODUCTION,
      });
      expect(result.exitCode).toBe(0);
      expect(ran).toBe(true);
      expect(audit.entries[0]).toMatchObject({ operator: "ada", breakGlass: "bg_1" });
    });

    it("needs no session outside production", async () => {
      const audit = new MemoryCommandAuditDriver();
      const result = await runCommandForTest([SeedCommand], ["acct:seed", "acme"], {
        audit,
        env: { STACKRA_ENVIRONMENT: "staging" },
      });
      expect(result.exitCode).toBe(0);
      expect(audit.entries[0]?.breakGlass).toBeUndefined();
    });
  });

  it("reads audit, bin and secret from the declaration", () => {
    const structure = readCommand(SeedCommand);
    expect(structure.audit).toBe(true);
    expect(structure.bin).toBe(false);
    expect(structure.options.find((field) => field.property === "pin")?.secret).toBe(true);
    expect(auditValues(structure, { slug: "x" })).toEqual({
      slug: "x",
      pin: "[redacted]",
      "api-key": "[redacted]",
      fail: false,
    });
  });
});

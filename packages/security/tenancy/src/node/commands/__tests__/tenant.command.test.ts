/**
 * Stackra file contract:
 * Purpose: proves `tenant:create <name>` and `tenant:list` work through the `TenantDirectory` (create, then list,
 *          with --json data), each records a platform-scope audit entry, and a missing `CommandAudit` refuses them.
 * Boundary: test only; the directory is the memory driver and the audit the memory one.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-001 and FR-015.
 */
// @covers sta-1731:FR-001 sta-1731:FR-015 sta-1731:FR-018
import { MemoryCommandAuditDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenantDirectoryDriver } from "#core/drivers/memory-tenant-directory.driver";
import { TenantCreateCommand } from "#node/commands/tenant-create.command";
import { TenantListCommand } from "#node/commands/tenant-list.command";

/** A container that builds each command with `directory`. */
const serving = (directory: MemoryTenantDirectoryDriver) => async () => ({
  get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
    Reflect.construct(type, [directory]) as T,
  has: () => true,
  close: async () => {},
});

describe("tenant commands", () => {
  it("creates a tenant, lists it, and audits both runs", async () => {
    const directory = new MemoryTenantDirectoryDriver();
    const audit = new MemoryCommandAuditDriver();
    const options = { audit, container: serving(directory), env: { STACKRA_OPERATOR: "ada" } };
    const created = await runCommandForTest(
      [TenantCreateCommand, TenantListCommand],
      ["tenant:create", "Acme", "--json"],
      options,
    );
    expect(created.exitCode).toBe(0);
    expect(created.json).toMatchObject({ ok: true, data: { tenant: { name: "Acme" } } });
    const listed = await runCommandForTest(
      [TenantCreateCommand, TenantListCommand],
      ["tenant:list", "--json"],
      options,
    );
    expect(listed.json).toMatchObject({ ok: true, data: { tenants: [{ name: "Acme" }] } });
    expect(audit.entries.map((entry) => entry.command)).toEqual(["tenant:create", "tenant:list"]);
    // The operator reaches the registry, which authorises and attributes each call.
    expect(directory.calls).toEqual(["create:ada", "list:ada"]);
  });

  it("refuses to run with no CommandAudit bound", async () => {
    const directory = new MemoryTenantDirectoryDriver();
    const result = await runCommandForTest([TenantListCommand], ["tenant:list"], {
      container: async () => ({
        get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
          Reflect.construct(type, [directory]) as T,
        has: () => false,
        close: async () => {},
      }),
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("CommandAudit");
  });
});

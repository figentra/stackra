/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTenantDirectoryDriver`: it is the `TenantDirectory` port, creates a tenant with a
 *          minted `scp_` id, and lists tenants oldest first.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1731 spec FR-001.
 */
// @covers sta-1731:FR-001
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenantDirectoryDriver } from "#core/drivers/memory-tenant-directory.driver";
import { isTenantId } from "#core/functions/is-tenant-id.function";
import { TenantDirectory } from "#core/ports/tenant-directory.port";

describe("MemoryTenantDirectoryDriver", () => {
  it("creates and lists tenants", async () => {
    const directory = new MemoryTenantDirectoryDriver();
    expect(directory).toBeInstanceOf(TenantDirectory);
    const acme = await directory.create({ name: "Acme" });
    await directory.create({ name: "Globex" });
    expect(isTenantId(acme.id)).toBe(true);
    expect((await directory.list()).map((tenant) => tenant.name)).toEqual(["Acme", "Globex"]);
  });
});

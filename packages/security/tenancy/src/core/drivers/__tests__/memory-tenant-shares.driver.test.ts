/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTenantSharesDriver` and `MemorySandboxTenantsDriver`: each is its port, saves and reads
 *          by id, and lists by tenant (either side of a share; a live tenant's sandboxes oldest first).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0343 (decision 1); ADR 0280 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySandboxTenantsDriver } from "#core/drivers/memory-sandbox-tenants.driver";
import { MemoryTenantSharesDriver } from "#core/drivers/memory-tenant-shares.driver";
import { RevokedCopy } from "#core/enums/revoked-copy.enum";
import { ShareStatus } from "#core/enums/share-status.enum";
import { SandboxTenants } from "#core/ports/sandbox-tenants.port";
import { TenantShares } from "#core/ports/tenant-shares.port";

const FIRM = "scp_01j9z3k4m5n6p7q8r9s0t1v2f1";
const CLIENT = "scp_01j9z3k4m5n6p7q8r9s0t1v2c1";
const OTHER = "scp_01j9z3k4m5n6p7q8r9s0t1v2o1";
const at = new Date("2026-10-25T09:00:00Z");

describe("MemoryTenantSharesDriver", () => {
  it("saves, reads and lists by either party", async () => {
    const store = new MemoryTenantSharesDriver();
    expect(store).toBeInstanceOf(TenantShares);
    await store.save({
      id: "shr_1",
      proposer: FIRM,
      receiver: CLIENT,
      source: { kind: "document", id: "doc_1" },
      items: { document: { onRevoke: RevokedCopy.Delete, receiverWritable: false } },
      crossRegion: false,
      status: ShareStatus.Proposed,
      proposedAt: at,
      changedAt: at,
    });
    expect((await store.get("shr_1"))?.receiver).toBe(CLIENT);
    expect(await store.list(CLIENT)).toHaveLength(1);
    expect(await store.list(OTHER)).toHaveLength(0);
  });
});

describe("MemorySandboxTenantsDriver", () => {
  it("lists a live tenant's sandboxes oldest first", async () => {
    const store = new MemorySandboxTenantsDriver();
    expect(store).toBeInstanceOf(SandboxTenants);
    await store.save({ id: "scp_b", live: FIRM, name: "B", createdAt: new Date("2026-10-26") });
    await store.save({ id: "scp_a", live: FIRM, name: "A", createdAt: at });
    expect((await store.list(FIRM)).map((s) => s.id)).toEqual(["scp_a", "scp_b"]);
  });
});

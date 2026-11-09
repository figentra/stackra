/**
 * Stackra file contract:
 * Purpose: unit tests of `RevokeSecureChangePartitionMigration`: one transactional step that revokes every privilege on
 *          `outbox.secure_change_partition(text)` from `PUBLIC` and nothing else.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gap C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RevokeSecureChangePartitionMigration } from "#node/database/migrations/0007-revoke-secure-change-partition.migration";

describe("RevokeSecureChangePartitionMigration", () => {
  const { after, steps } = compileMigration(RevokeSecureChangePartitionMigration, {
    schema: "outbox",
  });

  it("is one transactional step that revokes the partition helper from PUBLIC", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    const sql = steps[0]?.sql.join("\n") ?? "";
    expect(sql).toContain(
      "revoke all on function outbox.secure_change_partition(text) from public",
    );
    expect(sql).not.toContain("grant");
  });
});

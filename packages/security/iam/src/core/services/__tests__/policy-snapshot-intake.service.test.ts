/**
 * Stackra file contract:
 * Purpose: unit tests of `PolicySnapshotIntakeService`: it decodes an event's snapshot JSON and keeps it under the
 *          event's tenant, keeps only a higher version (a redelivery is harmless), and refuses an event with no
 *          principal or a malformed snapshot without storing anything.
 * Boundary: test only; the memory snapshot store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 4); ADR 0407; STA-815.
 */
import { describe, expect, it } from "@stackra/testing";

import type { PolicySnapshot } from "#contracts/index";
import { MemoryPolicySnapshotStoreDriver } from "#core/drivers/memory-policy-snapshot-store.driver";
import { PolicySnapshotIntakeService } from "#core/services/policy-snapshot-intake.service";

const PRINCIPAL = "usr_01j9z3k4m5n6p7q8r9s0t1v2r1";

/** A snapshot at `version`, as the event's JSON carries it. */
const json = (version: number): unknown =>
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
  JSON.parse(
    JSON.stringify({
      version,
      grants: [
        {
          role: "manager",
          scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" },
          expiresAt: new Date("2027-01-01T00:00:00.000Z"),
        },
      ],
      roles: {},
      denies: [],
      visibility: [],
    } satisfies PolicySnapshot),
  );

describe(PolicySnapshotIntakeService, () => {
  it("decodes and keeps the snapshot under the event's tenant, newer versions only", async () => {
    const store = new MemoryPolicySnapshotStoreDriver();
    const intake = new PolicySnapshotIntakeService(store);
    const event = { principal: PRINCIPAL, snapshot: json(2), scopeId: "ten_acme" } as const;
    expect(await intake.handle(event)).toBe(true);
    expect(await intake.handle(event)).toBe(false);
    expect(await intake.handle({ ...event, snapshot: json(1) })).toBe(false);
    const held = await store.read(PRINCIPAL, "ten_acme");
    expect(held?.version).toBe(2);
    expect(held?.grants[0]?.expiresAt).toEqual(new Date("2027-01-01T00:00:00.000Z"));
    expect(await store.read(PRINCIPAL)).toBeUndefined();
  });

  it("refuses an event with no principal or a malformed snapshot, storing nothing", async () => {
    const store = new MemoryPolicySnapshotStoreDriver();
    const intake = new PolicySnapshotIntakeService(store);
    await expect(intake.handle({ principal: "", snapshot: json(1) })).rejects.toThrow(TypeError);
    const malformed = { principal: PRINCIPAL, snapshot: { version: "x" } };
    await expect(intake.handle(malformed)).rejects.toThrow(TypeError);
    expect(await store.read(PRINCIPAL)).toBeUndefined();
  });
});

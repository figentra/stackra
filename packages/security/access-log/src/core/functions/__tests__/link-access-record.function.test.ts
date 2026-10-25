/**
 * Stackra file contract:
 * Purpose: unit tests of `linkAccessRecord`: a new chain starts at sequence 1 after 64 zeros, the next link follows the
 *          previous one's hash, the hash is 64 hex characters that change with any field and not with key order, and
 *          only the record fields are kept.
 * Boundary: test only; Web Crypto of the test runtime.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3).
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AccessRecord } from "#contracts/types/access-record.type";
import { linkAccessRecord } from "#core/functions/link-access-record.function";

const AGENT: Actor = {
  kind: ActorKind.Agent,
  id: "agt_support",
  onBehalfOf: { kind: ActorKind.Service, id: "svc_notifications" },
};

const RECORD: AccessRecord = {
  callId: "call_1",
  actor: AGENT,
  target: "CustomerReads.view",
  classification: DataClassification.Personal,
  subjects: ["usr_1"],
  at: new Date("2026-10-24T08:00:00.000Z"),
};

describe("linkAccessRecord", () => {
  it("starts a chain at sequence 1 after 64 zeros", async () => {
    const link = await linkAccessRecord(RECORD);
    expect(link).toMatchObject({ ...RECORD, sequence: 1, previousHash: "0".repeat(64) });
    expect(link.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("links after the previous link's hash", async () => {
    const first = await linkAccessRecord(RECORD);
    const second = await linkAccessRecord({ ...RECORD, callId: "call_2" }, first);
    expect(second.sequence).toBe(2);
    expect(second.previousHash).toBe(first.hash);
    expect(second.hash).not.toBe(first.hash);
  });

  it("hashes the content, not the key order of the actor", async () => {
    const reordered: Actor = {
      onBehalfOf: { id: "svc_notifications", kind: ActorKind.Service },
      id: "agt_support",
      kind: ActorKind.Agent,
    };
    const base = await linkAccessRecord(RECORD);
    expect((await linkAccessRecord({ ...RECORD, actor: reordered })).hash).toBe(base.hash);
    expect((await linkAccessRecord({ ...RECORD, subjects: ["usr_2"] })).hash).not.toBe(base.hash);
    expect(
      (await linkAccessRecord({ ...RECORD, at: new Date("2026-10-24T08:00:00.001Z") })).hash,
    ).not.toBe(base.hash);
  });

  it("keeps only the record fields", async () => {
    const row = { ...RECORD, id: "acl_01j9z3k4m5n6p7q8r9s0t1v2w3" };
    expect(Object.keys(await linkAccessRecord(row)).sort()).toEqual([
      "actor",
      "at",
      "callId",
      "classification",
      "hash",
      "previousHash",
      "sequence",
      "subjects",
      "target",
    ]);
  });
});

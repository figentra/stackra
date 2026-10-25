/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogEntryFactory`: an unsaved row is an `AccessLogEntry` with every stored field filled
 *          (a user actor, a subject, a sequence from 1 and two 64-character hex hashes), and overrides win.
 * Boundary: test only; `make` builds without a database, and the factory's model is registered here as gen would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0190.
 */
import { ActorKind, DataClassification } from "@stackra/contracts";
import { registerModelPartners } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogEntryFactory } from "#node/database/factories/access-log-entry.factory";
import { AccessLogEntry } from "#node/models/access-log-entry.model";

registerModelPartners([[AccessLogEntryFactory, AccessLogEntry]]);

describe("AccessLogEntryFactory", () => {
  it("builds a filled access record", () => {
    const entry = AccessLogEntryFactory.new().make();
    expect(entry).toBeInstanceOf(AccessLogEntry);
    expect(entry.classification).toBe(DataClassification.Personal);
    expect(entry.actor.kind).toBe(ActorKind.User);
    expect(entry.actor.id).toMatch(/^usr_/);
    expect(entry.subjects).toHaveLength(1);
    expect(entry.sequence).toBeGreaterThanOrEqual(1);
    expect(entry.previousHash).toMatch(/^[0-9a-f]{64}$/);
    expect(entry.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("lets overrides win", () => {
    const at = new Date("2026-07-13T00:00:00Z");
    expect(AccessLogEntryFactory.new().make({ at, target: "OrderService.find" })).toMatchObject({
      at,
      target: "OrderService.find",
    });
  });
});

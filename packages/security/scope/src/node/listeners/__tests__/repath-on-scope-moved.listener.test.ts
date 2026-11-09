/**
 * Stackra file contract:
 * Purpose: unit tests of `RepathOnScopeMovedListener`: it is a queued listener with back-off, and a move hands
 *          `repathAllRecords` the event's old and new paths.
 * Boundary: test only; `repathAllRecords` is mocked, so no database runs (its own tests move rows on PGlite).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0411.
 */
import { kindOf } from "@stackra/container";
import { repathAllRecords } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ScopeMoved } from "#node/events/scope-moved.event";
import { RepathOnScopeMovedListener } from "#node/listeners/repath-on-scope-moved.listener";

vi.mock("@stackra/database", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  repathAllRecords: vi.fn(async () => []),
}));

describe(RepathOnScopeMovedListener, () => {
  it("is a queued listener with back-off", () => {
    expect(kindOf(RepathOnScopeMovedListener)).toMatchObject({
      kind: "listener",
      options: { queue: "default", retry: { attempts: 8 } },
    });
  });

  it("re-paths every opted-in model from the old path to the new one", async () => {
    const event = ScopeMoved.create({
      scopeId: "scp_01ja0000000000000000000009",
      from: "platform.a.shop",
      to: "platform.b.shop",
    });
    await new RepathOnScopeMovedListener().handle(event);
    expect(repathAllRecords).toHaveBeenCalledWith("platform.a.shop", "platform.b.shop");
  });
});

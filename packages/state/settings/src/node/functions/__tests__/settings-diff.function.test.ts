/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsDiff`: it answers what applying the pack would change at the node, row by row, against
 *          the node's own values of the pack's groups only (never inherited values, never a group the pack does not
 *          name); it writes nothing; text that is not a pack is refused before any session opens; the node is the one
 *          the caller named.
 * Boundary: test only; the session opener is replaced by one that runs the diff over a real `SettingsPackService` on
 *           the memory drivers, so no database is needed. The Postgres run is `settings-runner-isolation.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4); ADR 0280 (decision 4: a reviewed diff).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { beforeEach, vi } from "vitest";

import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsPackService } from "#core/services/settings-pack.service";
import { SettingsResolver } from "#core/services/settings-resolver.service";
import { settingsDiff } from "#node/functions/settings-diff.function";

/** What the replaced session opener was asked, and the service it runs the callback over. */
const session = vi.hoisted(() => ({
  packs: undefined as SettingsPackService | undefined,
  scopes: [] as ScopeRef[],
}));

vi.mock("#node/functions/open-settings-session.function", () => ({
  openSettingsSession: async (
    scope: ScopeRef,
    run: (packs: SettingsPackService) => Promise<unknown>,
  ) => {
    session.scopes.push(scope);
    if (session.packs === undefined) throw new Error("the test opened no pack service");
    return run(session.packs);
  },
}));

const PLATFORM: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const CLOCK = { now: () => new Date("2026-10-25T10:00:00.000Z") } as unknown as Clock;

let revisions = new MemorySettingRevisionStoreDriver();

/** The options every call shares; the member and environment are only the CLI's report. */
const call = (yaml: string, scope: ScopeRef = ACME) => ({
  cwd: "/members/orders",
  environment: "dev",
  scope,
  yaml,
});

describe(settingsDiff, () => {
  beforeEach(async () => {
    session.scopes = [];
    revisions = new MemorySettingRevisionStoreDriver();
    const fresh = new MemorySettingValueStoreDriver();
    await fresh.write("orders", { scope: PLATFORM }, { refundWindowDays: 7, inherited: true });
    await fresh.write("orders", { scope: ACME }, { refundWindowDays: 14, gone: "x" }, ["gone"]);
    await fresh.write("unnamed", { scope: ACME }, { keep: 1 });
    session.packs = new SettingsPackService(
      fresh,
      new SettingsResolver(fresh, new MemorySettingFloorSourceDriver(), revisions, CLOCK),
    );
  });

  it("answers every changed path, sorted, against the node's own values", async () => {
    const rows = await settingsDiff(
      call(
        "groups:\n  orders:\n    values:\n      refundWindowDays: 30\n      added: true\n    locked: [added]\n",
      ),
    );
    expect(rows).toEqual([
      { group: "orders", path: "added", after: true, lockedBefore: false, lockedAfter: true },
      {
        group: "orders",
        path: "gone",
        before: "x",
        lockedBefore: true,
        lockedAfter: false,
      },
      {
        group: "orders",
        path: "refundWindowDays",
        before: 14,
        after: 30,
        lockedBefore: false,
        lockedAfter: false,
      },
    ]);
  });

  it("answers nothing when the node already equals the pack", async () => {
    await expect(
      settingsDiff(
        call(
          "groups:\n  orders:\n    values:\n      refundWindowDays: 14\n      gone: x\n    locked: [gone]\n",
        ),
      ),
    ).resolves.toEqual([]);
  });

  it("compares the pack's groups only: a group the pack does not name is not a removal", async () => {
    const rows = await settingsDiff(
      call(
        "groups:\n  orders:\n    values:\n      refundWindowDays: 14\n      gone: x\n    locked: [gone]\n",
      ),
    );
    expect(rows.some((row) => row.group === "unnamed")).toBe(false);
  });

  it("never counts an inherited value as the node's own", async () => {
    const rows = await settingsDiff(
      call("groups:\n  orders:\n    values:\n      inherited: true\n"),
    );
    expect(rows.find((row) => row.path === "inherited")).toEqual({
      group: "orders",
      path: "inherited",
      after: true,
      lockedBefore: false,
      lockedAfter: false,
    });
  });

  it("writes nothing and records no revision", async () => {
    await settingsDiff(call("groups:\n  orders:\n    values:\n      refundWindowDays: 99\n"));
    await expect(
      session.packs?.exportPack({ scope: ACME }, ["orders", "unnamed"]),
    ).resolves.toEqual({
      groups: {
        orders: { values: { refundWindowDays: 14, gone: "x" }, locked: ["gone"] },
        unnamed: { values: { keep: 1 }, locked: [] },
      },
    });
    await expect(revisions.list("orders", { scope: ACME })).resolves.toEqual([]);
  });

  it("opens the session at the node the caller named", async () => {
    await settingsDiff(call("groups:\n  orders:\n    values: {}\n", PLATFORM));
    expect(session.scopes).toEqual([PLATFORM]);
  });

  it("refuses text that is not a pack before any session opens", async () => {
    await expect(settingsDiff(call("groups:\n  Orders:\n    values: {}\n"))).rejects.toThrow();
    await expect(
      settingsDiff(call("groups:\n  orders:\n    values:\n      a:\n        nested: 1\n")),
    ).rejects.toThrow();
    expect(session.scopes).toEqual([]);
  });
});

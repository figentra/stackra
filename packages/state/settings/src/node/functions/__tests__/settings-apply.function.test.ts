/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsApply`: it makes the node's own values of the pack's groups equal the pack, one
 *          sandbox revision per changed group authored by the caller (with the reason when one is given), and answers
 *          with the revision ids; a blank author is refused before the text is read; text that is not a pack is refused
 *          before any session opens; the node and the holder's market are the ones the caller named.
 * Boundary: test only; the session opener is replaced by one that runs the apply over a real `SettingsPackService` on
 *           the memory drivers, so no database is needed. The Postgres run is `settings-runner-isolation.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 4); ADR 0359 (decisions 3 and 11); ADR 0419 (decision 2).
 */
import type { Clock, ScopeRef } from "@stackra/contracts";
import type { ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";
import { beforeEach, vi } from "vitest";

import { SettingEnvironment } from "#contracts/index";
import { MemorySettingFloorSourceDriver } from "#core/drivers/memory-setting-floor-source.driver";
import { MemorySettingRevisionStoreDriver } from "#core/drivers/memory-setting-revision-store.driver";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingsPackService } from "#core/services/settings-pack.service";
import { SettingsResolver } from "#core/services/settings-resolver.service";
import { settingsApply } from "#node/functions/settings-apply.function";

/** What the replaced session opener was asked, and the service it runs the callback over. */
const session = vi.hoisted(() => ({
  packs: undefined as SettingsPackService | undefined,
  opened: [] as { scope: ScopeRef; market: ResolvedPack | undefined }[],
}));

vi.mock("#node/functions/open-settings-session.function", () => ({
  openSettingsSession: async (
    scope: ScopeRef,
    run: (packs: SettingsPackService) => Promise<unknown>,
    market?: ResolvedPack,
  ) => {
    session.opened.push({ scope, market });
    if (session.packs === undefined) throw new Error("the test opened no pack service");
    return run(session.packs);
  },
}));

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const CLOCK = { now: () => new Date("2026-10-25T10:00:00.000Z") } as unknown as Clock;
const AUTHOR = "usr_01j9z3k4m5n6p7q8r9s0t1v2w9";
const PACK =
  "groups:\n  orders:\n    values:\n      refundWindowDays: 30\n    locked: [refundWindowDays]\n  checkout:\n    values:\n      guest: true\n";

let store = new MemorySettingValueStoreDriver();
let revisions = new MemorySettingRevisionStoreDriver();

/** The options every call shares; the member and environment are only the CLI's report. */
const call = (overrides: Partial<Parameters<typeof settingsApply>[0]> = {}) => ({
  cwd: "/members/orders",
  environment: "dev",
  scope: ACME,
  yaml: PACK,
  author: AUTHOR,
  ...overrides,
});

describe(settingsApply, () => {
  beforeEach(async () => {
    session.opened = [];
    store = new MemorySettingValueStoreDriver();
    revisions = new MemorySettingRevisionStoreDriver();
    await store.write("orders", { scope: ACME }, { refundWindowDays: 14, old: "x" });
    session.packs = new SettingsPackService(
      store,
      new SettingsResolver(store, new MemorySettingFloorSourceDriver(), revisions, CLOCK),
    );
  });

  it("makes the node's own values equal the pack, one revision per changed group, and answers their ids", async () => {
    const { revisions: ids } = await settingsApply(call());
    expect(ids).toEqual(["rev_1", "rev_2"]);
    await expect(
      session.packs?.exportPack({ scope: ACME }, ["orders", "checkout"]),
    ).resolves.toEqual({
      groups: {
        checkout: { values: { guest: true }, locked: [] },
        orders: { values: { refundWindowDays: 30 }, locked: ["refundWindowDays"] },
      },
    });
  });

  it("records each revision in the sandbox, authored by the caller, with the reason given", async () => {
    await settingsApply(call({ reason: "tighten the refund window for the pilot" }));
    const checkout = await revisions.find("rev_1");
    const orders = await revisions.find("rev_2");
    expect([checkout?.group, orders?.group]).toEqual(["checkout", "orders"]);
    for (const revision of [checkout, orders]) {
      expect(revision?.environment).toBe(SettingEnvironment.Sandbox);
      expect(revision?.author).toBe(AUTHOR);
      expect(revision?.reason).toBe("tighten the refund window for the pilot");
    }
  });

  it("records no reason when none is given", async () => {
    await settingsApply(call());
    await expect(revisions.find("rev_1")).resolves.toMatchObject({ reason: null });
  });

  it("answers no revision and writes nothing when the node already equals the pack", async () => {
    await settingsApply(call());
    const again = await settingsApply(call());
    expect(again).toEqual({ revisions: [] });
    await expect(revisions.find("rev_3")).resolves.toBeNull();
  });

  it("opens the session at the named node with the holder's market, when the CLI resolved one", async () => {
    const market = { marker: "ae" } as unknown as ResolvedPack;
    await settingsApply(call({ market }));
    await settingsApply(call());
    expect(session.opened).toEqual([
      { scope: ACME, market },
      { scope: ACME, market: undefined },
    ]);
  });

  it("refuses a blank author before reading the text or opening a session", async () => {
    for (const author of ["", "   "])
      await expect(settingsApply(call({ author, yaml: "not: a pack" }))).rejects.toThrow(
        new TypeError("A settings apply names its author, for the revision record"),
      );
    expect(session.opened).toEqual([]);
  });

  it("refuses text that is not a pack before any session opens, and writes nothing", async () => {
    await expect(
      settingsApply(call({ yaml: "groups:\n  Orders:\n    values: {}\n" })),
    ).rejects.toThrow();
    expect(session.opened).toEqual([]);
    await expect(store.layers("orders", { scope: ACME })).resolves.toEqual([
      expect.objectContaining({ values: { refundWindowDays: 14, old: "x" } }),
    ]);
  });
});

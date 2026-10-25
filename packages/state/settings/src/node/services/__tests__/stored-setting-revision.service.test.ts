/**
 * Stackra file contract:
 * Purpose: unit tests of `StoredSettingRevisionService`: append maps a revision's holder and times to columns; a list
 *          names its holder exactly, newest first; due asks for scheduled rows up to a time, oldest first.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5); ADR 0327 (decisions 3 and 9).
 */
import type { ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { SettingRevision } from "#contracts/index";
import { StoredSettingRevision } from "#node/models/stored-setting-revision.model";
import { StoredSettingRevisionService } from "#node/services/stored-setting-revision.service";

registerModelPartners([[StoredSettingRevisionService, StoredSettingRevision]]);

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** Connects a recording entity manager. */
function connect() {
  const em = {
    find: vi.fn(async (_model: unknown, _where: object, _options?: unknown) => []),
    findOne: vi.fn(async () => null),
    create: vi.fn((_model: unknown, data: object) =>
      Object.assign(new StoredSettingRevision(), data),
    ),
    assign: vi.fn((row: object, data: object) => Object.assign(row, data)),
    persist: vi.fn(),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

afterEach(() => {
  vi.restoreAllMocks();
});

const REVISION: Omit<SettingRevision, "id"> = {
  group: "orders",
  target: { scope: ACME },
  values: { a: 1 },
  removed: [],
  previous: {},
  author: "usr_a",
  reason: null,
  environment: "live",
  breakGlass: false,
  status: "scheduled",
  effectiveAt: "2026-11-01T00:00:00.000Z",
  createdAt: "2026-10-25T10:00:00.000Z",
  decidedBy: null,
  appliedAt: null,
};

describe(StoredSettingRevisionService, () => {
  it("appends a revision with its holder columns and times", async () => {
    const em = connect();
    const row = await new StoredSettingRevisionService().append(REVISION);
    expect(em.create).toHaveBeenCalled();
    expect(row).toMatchObject({
      groupKey: "orders",
      scopeId: ACME.id,
      scopePath: ACME.path,
      userId: null,
      locked: null,
      effectiveAt: new Date("2026-11-01T00:00:00.000Z"),
      appliedAt: null,
    });
  });

  it("lists a holder's revisions newest first and asks for due scheduled rows", async () => {
    const em = connect();
    const service = new StoredSettingRevisionService();
    await service.listOf("orders", { scope: ACME });
    expect(em.find.mock.calls[0]?.[1]).toMatchObject({
      groupKey: "orders",
      scopeId: ACME.id,
      userId: null,
    });
    expect(em.find.mock.calls[0]?.[2]).toMatchObject({ orderBy: { createdAt: "desc" } });
    const at = new Date("2026-11-02T00:00:00.000Z");
    await service.dueAt(at);
    expect(em.find.mock.calls[1]?.[1]).toMatchObject({
      status: "scheduled",
      effectiveAt: { $lte: at },
    });
  });
});

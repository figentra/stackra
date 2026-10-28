/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the six `Permissions` classes are its values and nothing else, and
 *          each job's permission is system-held at its risk (L4 for the jobs that drop or delete data, L2 for the
 *          reindex and query log jobs).
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0099; ADR 0462 (decision 1).
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/data-maintenance", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "ChangeLogPermissions",
      "IndexPermissions",
      "OutboxMessagePermissions",
      "PartitionPermissions",
      "QueryPermissions",
      "RecordPermissions",
    ]);
  });

  it.each([
    [core.PartitionPermissions.maintain, Risk.L4],
    [core.RecordPermissions.prune, Risk.L4],
    [core.IndexPermissions.reindex, Risk.L2],
    [core.IndexPermissions.reindexSemantic, Risk.L2],
    [core.QueryPermissions.record, Risk.L2],
    [core.ChangeLogPermissions.maintain, Risk.L4],
    [core.OutboxMessagePermissions.prune, Risk.L4],
  ])("declares a system-held permission at its risk", (permission, risk) => {
    expect(permission).toBeInstanceOf(Permission);
    expect(permission.risk).toBe(risk);
    expect(permission.isSystem).toBe(true);
  });

  it("extends Permissions in every class", () => {
    for (const value of Object.values(core)) expect(Object.getPrototypeOf(value)).toBe(Permissions);
  });
});

/**
 * Stackra file contract:
 * Purpose: unit tests of `PurgeSubjectExportsAction`: a system-only job on a nightly per-scope cron that deletes the
 *          export zips older than `exportTtlDays`, or of unknown age, and keeps the rest.
 * Boundary: test only; a recording stand-in disk and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 1); ADR 0305 (rule 28); STA-1375.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { FileSystem } from "@stackra/filesystem/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PrivacyConfig } from "#config/privacy.config";
import { PurgeSubjectExportsAction } from "#node/actions/purge-subject-exports.action";
import { PurgeSubjectExportsInput } from "#node/schemas/purge-subject-exports-input.schema";

/** When the job runs. */
const NOW = new Date("2026-10-28T04:00:00Z");

describe("PurgeSubjectExportsAction", () => {
  it("is a system-only job on a nightly per-scope cron", () => {
    const options = kindOf(PurgeSubjectExportsAction)?.options;
    expect(options?.["key"]).toBe("subject_export.purge");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({
      unique: true,
      timeout: "5m",
      cron: { schedule: "0 4 * * *", perScope: true },
    });
  });

  it("deletes the zips past the window and those of unknown age", async () => {
    const ages: Record<string, Date | null> = {
      "privacy/exports/old.zip": new Date("2026-10-20T00:00:00Z"),
      "privacy/exports/new.zip": new Date("2026-10-27T00:00:00Z"),
      "privacy/exports/unknown.zip": null,
    };
    const listed: unknown[][] = [];
    const deleted: unknown[][] = [];
    const disk = {
      list: async (...args: unknown[]) => {
        listed.push(args);
        return Object.keys(ages);
      },
      stat: async (path: string) => ({
        path,
        size: 1,
        lastModified: ages[path],
        contentType: null,
      }),
      delete: async (...args: unknown[]) => {
        deleted.push(args);
        return true;
      },
    } as unknown as FileSystem;

    const output = await new PurgeSubjectExportsAction(disk, buildConfig(PrivacyConfig)).handle(
      PurgeSubjectExportsInput.create({}),
      fakeActionContext({ now: () => new Date(NOW) }),
    );

    expect(output.deleted).toBe(2);
    expect(listed).toEqual([["privacy/exports/"]]);
    expect(deleted).toEqual([["privacy/exports/old.zip"], ["privacy/exports/unknown.zip"]]);
  });
});

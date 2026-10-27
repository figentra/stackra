/**
 * Stackra file contract:
 * Purpose: unit tests of `ExportSubjectDataAction`: a system-only job, ten minutes at most, retried twice, that
 *          collects the subject's data at the call's instant, archives it and answers with the link.
 * Boundary: test only; a recording stand-in for `SubjectExportService` and a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 1); ADR 0305 (rule 28); STA-1375.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { SubjectExport } from "#contracts/types/subject-export.type";
import type { SubjectExportService } from "#core/services/subject-export.service";
import { ExportSubjectDataAction } from "#node/actions/export-subject-data.action";
import { ExportSubjectDataInput } from "#node/schemas/export-subject-data-input.schema";
import { ExportSubjectDataOutput } from "#node/schemas/export-subject-data-output.schema";

/** When the job runs. */
const NOW = new Date("2026-10-28T09:00:00Z");

describe("ExportSubjectDataAction", () => {
  it("is a system-only job", () => {
    const options = kindOf(ExportSubjectDataAction)?.options;
    expect(options?.["key"]).toBe("subject.export");
    expect(options?.["actors"]).toEqual([ActorKind.System]);
    expect(options?.["job"]).toEqual({ timeout: "10m", retries: 2 });
  });

  it("collects at the call's instant and returns the archived link", async () => {
    const collected: unknown[][] = [];
    const archived: unknown[][] = [];
    const data: SubjectExport = { subject: "usr_1", generatedAt: NOW.toISOString(), sections: [] };
    const exporter = {
      collect: async (...args: unknown[]) => {
        collected.push(args);
        return data;
      },
      archive: async (...args: unknown[]) => {
        archived.push(args);
        return {
          path: "privacy/exports/a.zip",
          url: "https://files.test/a.zip",
          expiresAt: "2026-11-04T09:00:00.000Z",
          records: 0,
        };
      },
    } as unknown as SubjectExportService;

    const output = await new ExportSubjectDataAction(exporter).handle(
      ExportSubjectDataInput.create({ subject: "usr_1" }),
      fakeActionContext({ now: () => new Date(NOW) }),
    );

    expect(output).toBeInstanceOf(ExportSubjectDataOutput);
    expect(output.url).toBe("https://files.test/a.zip");
    expect(collected).toEqual([["usr_1", NOW]]);
    expect(archived).toEqual([[data]]);
  });
});

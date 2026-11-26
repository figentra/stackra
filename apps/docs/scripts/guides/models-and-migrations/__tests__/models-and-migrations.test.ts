/**
 * Stackra file contract:
 * Purpose: the tests of the "Models and migrations" guide's examples on PGlite: both migrations compile, apply, revert
 *          and apply again; the first creates the table with its index and the second only adds a nullable column; and
 *          `ProjectService` writes projects in a transaction, reads the active ones due before a date (soonest first),
 *          closes one, refuses an unknown id with `not_found`, and soft-deletes one so reads hide it until asked.
 * Boundary: test only; the database is the memory driver (real Postgres SQL in WASM), started from the compiled
 *           migrations by `connectGuideDatabase`, and `projects.entities.ts` stands in for gen's output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0266; ADR 0269; STA-2843.
 */
import "./projects.entities";

import { isRefusal, NotFoundError } from "@stackra/errors";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { connectGuideDatabase } from "#scripts/guides/support/connect-guide-database";
import type { GuideDatabase } from "#scripts/guides/support/guide-database";
import { CreateProjectsMigration } from "../0001-create-projects.migration";
import { AddProjectEstimateMigration } from "../0002-add-project-estimate.migration";
import { ProjectService } from "../project.service";

let guide: GuideDatabase;

beforeAll(async () => {
  guide = await connectGuideDatabase([
    { schema: "projects", migrations: [CreateProjectsMigration, AddProjectEstimateMigration] },
  ]);
}, 120_000);

afterAll(async () => {
  await guide.close();
});

describe("Models and migrations guide", { timeout: 60_000 }, () => {
  it("compiles the first migration to the table and its index, and the second to one nullable column", () => {
    const [first = "", second = ""] = Object.values(guide.sql);
    expect(first).toContain('create schema if not exists "projects"');
    expect(first).toContain('create table "projects"."projects"');
    expect(first).toContain("idx_projects_status_created_at");
    expect(second).toContain('add column "estimate_days" integer null');
    expect(second).not.toContain("not null");
  });

  it("writes projects, reads the ones due soonest, closes one and soft-deletes one", async () => {
    const { database } = guide;
    // #region write-and-read
    const projects = new ProjectService();

    await database.transaction(async () => {
      projects.create({ name: "Website refresh", dueOn: new Date("2026-12-01") });
      projects.create({ name: "Mobile app", dueOn: new Date("2027-03-01") });
      projects.create({ name: "Brand book", dueOn: new Date("2026-12-15"), estimateDays: 5 });
    });

    const due = await projects.dueBefore(new Date("2027-01-01"));
    expect(due.map((project) => project.name)).toEqual(["Website refresh", "Brand book"]);
    expect(due[0]?.id).toMatch(/^prj_/);
    // #endregion write-and-read

    // #region close-and-delete
    const [website, brandBook] = due;
    if (website === undefined || brandBook === undefined) throw new Error("two projects are due");

    await database.transaction(() => projects.close(website.id));
    expect((await projects.findOneOrFail({ id: website.id })).status).toBe("closed");

    await database.transaction(() => projects.delete({ id: brandBook.id }));
    expect(await projects.count({})).toBe(2);
    expect(await projects.count({}, { withDeleted: true })).toBe(3);
    // #endregion close-and-delete
  });

  it("refuses to close a project that does not exist", async () => {
    const projects = new ProjectService();
    const missing = guide.database.transaction(() =>
      projects.close("prj_01ja0000000000000000000099" as never),
    );
    await expect(missing).rejects.toSatisfy((error: unknown) => isRefusal(error, NotFoundError));
  });
});

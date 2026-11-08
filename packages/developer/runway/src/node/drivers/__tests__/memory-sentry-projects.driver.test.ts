/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySentryProjectsDriver`: an unknown project is `null`; a created one gets the next
 *          stand-in DSN under `<org>/<slug>` (the team is recorded, not keyed); each creation is recorded in order.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySentryProjectsDriver } from "#node/drivers/memory-sentry-projects.driver";

describe("MemorySentryProjectsDriver", () => {
  it("finds and creates projects by org and slug", async () => {
    const sentry = new MemorySentryProjectsDriver();
    sentry.projects.set("acme/web", "https://key@o1.ingest.sentry.io/9");

    expect(await sentry.findProject("acme", "web")).toBe("https://key@o1.ingest.sentry.io/9");
    expect(await sentry.findProject("acme", "staff")).toBeNull();
    const dsn = await sentry.createProject("acme", "mobile", "staff");

    expect(dsn).toBe("https://public@o0.ingest.sentry.io/2");
    expect(await sentry.findProject("acme", "staff")).toBe(dsn);
    expect(sentry.calls).toEqual(["createProject acme mobile staff"]);
  });
});

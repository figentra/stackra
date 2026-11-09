/**
 * Stackra file contract:
 * Purpose: unit tests of `openSettingsSession`: a node below a tenant node is refused before any connection, naming the
 *          node, and the run never starts.
 * Boundary: test only; no database: the refusal comes before `DATABASE_URL` is read. The tenant set at a tenant node and
 *           the platform above it run in the integration tier (`settings-runner-isolation.int.test.ts`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0327 (decision 8: the tenant level); ADR 0239 (2026-11-07 amendment, gap C).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { openSettingsSession } from "#node/functions/open-settings-session.function";

describe(openSettingsSession, () => {
  it("refuses a node below a tenant node before connecting", async () => {
    const run = vi.fn(async () => undefined);
    await expect(
      openSettingsSession(
        { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w5", path: "platform.alpha.acme.north" },
        run,
      ),
    ).rejects.toThrow(
      /cannot resolve the tenant of platform\.alpha\.acme\.north yet: it is below a tenant node/,
    );
    expect(run).not.toHaveBeenCalled();
  });
});

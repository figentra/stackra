/**
 * Stackra file contract:
 * Purpose: unit tests of `withDeployLock`: work runs under the environment's key with the default or given TTL and its
 *          result comes back; a second apply to a held environment is refused without running, while another
 *          environment still runs; an undeclared environment is refused; a failing work frees the lock.
 * Boundary: test only; the lock is an in-memory fake shaped as `Locks#tryWith`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352, ADR 0435.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RunwayLockedError } from "#core/errors/runway-locked.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { withDeployLock } from "#core/functions/with-deploy-lock.function";
import { DEPLOY_ROOT } from "#core/functions/__tests__/fixtures/deploy-root.fixture";
import { FakeLock } from "#core/functions/__tests__/fixtures/fake-lock.fixture";

describe("withDeployLock", () => {
  it("runs the work under the environment's key and returns its result", async () => {
    const lock = new FakeLock();

    await expect(withDeployLock(DEPLOY_ROOT, "staging", lock, async () => 42)).resolves.toBe(42);
    await withDeployLock(DEPLOY_ROOT, "production", lock, async () => 1, Duration.minutes(5));

    expect(lock.asked).toEqual([
      ["runway:deploy:acme:staging", Duration.minutes(30)],
      ["runway:deploy:acme:production", Duration.minutes(5)],
    ]);
    expect(lock.held.size).toBe(0);
  });

  it("refuses a second apply to a held environment and lets another environment run", async () => {
    const lock = new FakeLock();
    let ran = false;

    await withDeployLock(DEPLOY_ROOT, "production", lock, async () => {
      await expect(
        withDeployLock(DEPLOY_ROOT, "production", lock, async () => {
          ran = true;
        }),
      ).rejects.toThrow(RunwayLockedError);
      await expect(withDeployLock(DEPLOY_ROOT, "staging", lock, async () => "ok")).resolves.toBe(
        "ok",
      );
    });

    expect(ran).toBe(false);
  });

  it("refuses an environment the root runway does not declare", async () => {
    await expect(
      withDeployLock(DEPLOY_ROOT, "preview", new FakeLock(), async () => 1),
    ).rejects.toThrow(RunwayUnresolvedError);
  });

  it("frees the lock when the work fails", async () => {
    const lock = new FakeLock();

    await expect(
      withDeployLock(DEPLOY_ROOT, "staging", lock, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(lock.held.size).toBe(0);
  });
});

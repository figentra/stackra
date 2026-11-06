/**
 * Stackra file contract:
 * Purpose: tests of `fileDeployLock`: a second holder of a key is refused while the first runs, the file is gone after
 *          the work (also when it throws), a lease that has ended is taken over, and two keys never block each other.
 * Boundary: test only; a temporary directory per test, a fake clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0435; STA-1969.
 */
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { fileDeployLock } from "#node/functions/file-deploy-lock.function";

const TTL = Duration.minutes(30);

describe(fileDeployLock, () => {
  it("refuses a second holder of a key while the first runs, and frees it after", async () => {
    const directory = mkdtempSync(join(tmpdir(), "runway-lock-"));
    const lock = fileDeployLock(directory);
    let inner: boolean | undefined;
    const ran = await lock.tryWith("runway:deploy:core:production", TTL, async () => {
      inner = await lock.tryWith("runway:deploy:core:production", TTL, async () => {});
      expect(await lock.tryWith("runway:deploy:core:staging", TTL, async () => {})).toBe(true);
    });
    expect(ran).toBe(true);
    expect(inner).toBe(false);
    expect(await lock.tryWith("runway:deploy:core:production", TTL, async () => {})).toBe(true);
  });

  it("deletes the lock file when the work throws", async () => {
    const directory = mkdtempSync(join(tmpdir(), "runway-lock-"));
    const lock = fileDeployLock(directory);
    await expect(
      lock.tryWith("runway:deploy:core:production", TTL, async () => {
        throw new TypeError("provider failed");
      }),
    ).rejects.toThrow("provider failed");
    expect(existsSync(join(directory, "runway_deploy_core_production.lock"))).toBe(false);
  });

  it("takes over a lease that has ended", async () => {
    const directory = mkdtempSync(join(tmpdir(), "runway-lock-"));
    writeFileSync(
      join(directory, "runway_deploy_core_production.lock"),
      JSON.stringify({ pid: 1, until: 1000 }),
    );
    const lock = fileDeployLock(directory, () => 5000);
    expect(await lock.tryWith("runway:deploy:core:production", TTL, async () => {})).toBe(true);
  });

  it("refuses while a recorded lease is still live", async () => {
    const directory = mkdtempSync(join(tmpdir(), "runway-lock-"));
    writeFileSync(
      join(directory, "runway_deploy_core_production.lock"),
      JSON.stringify({ pid: 1, until: 9000 }),
    );
    const lock = fileDeployLock(directory, () => 5000);
    expect(await lock.tryWith("runway:deploy:core:production", TTL, async () => {})).toBe(false);
  });
});

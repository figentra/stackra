/**
 * Stackra file contract:
 * Purpose: unit tests of `ValkeyLockDriver`: it is the `LockDriver` port; it refuses to start without the
 *          `LOCKING_VALKEY_URL` secret; acquire, renew and release each run one script over the prefixed keys with the
 *          lease value `<owner>:<token>` and the TTL in milliseconds; a held key gives no lease; a lost lease does not
 *          renew; `within` runs the work as it is.
 * Boundary: test only; `iovalkey` is mocked by an in-memory evaluator of the three scripts, so no server runs. The
 *           server URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0103 (decision 2); ADR 0149.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LockingConfig } from "#config/locking.config";
import { LockDriver } from "#contracts/index";
import { ValkeyLockDriver } from "#node/drivers/valkey-lock.driver";

/** The in-memory server: key to value and lifetime, and every eval call. */
const server = vi.hoisted(() => ({
  values: new Map<string, { value: string; px: number }>(),
  calls: [] as unknown[][],
  urls: [] as unknown[],
}));

vi.mock("iovalkey", () => ({
  default: class {
    constructor(...args: unknown[]) {
      server.urls.push(args[0]);
    }

    async eval(script: string, count: number, ...rest: string[]) {
      server.calls.push([count, ...rest]);
      const keys = rest.slice(0, count);
      const argv = rest.slice(count);
      if (script.includes("incr")) {
        const [counter, ...locks] = keys;
        if (locks.some((key) => server.values.has(key))) return 0;
        const token = Number(server.values.get(counter as string)?.value ?? "0") + 1;
        server.values.set(counter as string, { value: String(token), px: 0 });
        for (const key of locks)
          server.values.set(key, { value: `${argv[0]}:${token}`, px: Number(argv[1]) });
        return token;
      }
      if (script.includes("pexpire")) {
        if (keys.some((key) => server.values.get(key)?.value !== argv[0])) return 0;
        for (const key of keys)
          server.values.set(key, { value: argv[0] as string, px: Number(argv[1]) });
        return 1;
      }
      for (const key of keys)
        if (server.values.get(key)?.value === argv[0]) server.values.delete(key);
      return 1;
    }
  },
}));

class LockSecrets extends SecretStore {
  get(name: string): string | undefined {
    return name === "LOCKING_VALKEY_URL" ? "redis://:pw@valkey.test:6379" : undefined;
  }
}

function driver(): ValkeyLockDriver {
  return new ValkeyLockDriver(
    buildConfig(LockingConfig, {
      values: { driver: "valkey", valkey: { keyPrefix: "t:" } },
      secrets: new LockSecrets(),
    }),
  );
}

describe(ValkeyLockDriver, () => {
  it("is a LockDriver that needs its secret", () => {
    expect(driver()).toBeInstanceOf(LockDriver);
    expect(server.urls.at(-1)).toBe("redis://:pw@valkey.test:6379");
    expect(() => new ValkeyLockDriver(buildConfig(LockingConfig))).toThrow(/LOCKING_VALKEY_URL/);
  });

  it("takes every key at once with a token, and refuses while any is held", async () => {
    server.values.clear();
    const locks = driver();
    const lease = await locks.tryAcquire(["a", "b"], "own-1", Duration.seconds(5));
    expect(lease).toEqual({ keys: ["a", "b"], owner: "own-1", token: 1 });
    expect(server.values.get("t:a")).toEqual({ value: "own-1:1", px: 5000 });
    expect(server.calls.at(-1)).toEqual([3, "t:~tokens", "t:a", "t:b", "own-1", "5000"]);
    await expect(
      locks.tryAcquire(["b", "c"], "own-2", Duration.seconds(5)),
    ).resolves.toBeUndefined();
    expect(server.values.has("t:c")).toBe(false);
  });

  it("renews and releases only its own lease", async () => {
    server.values.clear();
    const locks = driver();
    const lease = await locks.tryAcquire(["a"], "own-1", Duration.seconds(5));
    if (lease === undefined) throw new Error("no lease");
    await expect(locks.renew(lease, Duration.seconds(9))).resolves.toBe(true);
    expect(server.values.get("t:a")?.px).toBe(9000);
    const stale = { ...lease, token: lease.token - 1 };
    await expect(locks.renew(stale, Duration.seconds(9))).resolves.toBe(false);
    await locks.release(stale);
    expect(server.values.has("t:a")).toBe(true);
    await locks.release(lease);
    expect(server.values.has("t:a")).toBe(false);
  });

  it("runs work as it is", async () => {
    await expect(driver().within(async () => "ran")).resolves.toBe("ran");
  });
});

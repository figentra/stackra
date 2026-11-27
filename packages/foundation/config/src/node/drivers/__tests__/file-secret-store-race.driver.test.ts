/**
 * Stackra file contract:
 * Purpose: unit test of `FileSecretStoreDriver`'s size check against a file that changes between the check and the
 *          read (the time-of-check, time-of-use race): a secret file that passes the 64 KiB check while it is small
 *          and then grows past it is refused, never read in unchecked.
 * Boundary: test only; `node:fs/promises` is passed through, and a hook grows the file right after the driver's first
 *           look at it (`stat` or `open`), as a platform swapping the file would. Values are made-up canaries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0371 (amendment 2026-11-27, STA-258).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type * as FsPromises from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SecretFilesConfig } from "#config/secret-files.config";
import { buildConfig } from "#core/functions/build-config.function";
import { FileSecretStoreDriver } from "#node/drivers/file-secret-store.driver";

/** `look` runs once after the driver first looks at a file (its `stat` or its `open`), then clears itself. */
const after = vi.hoisted(() => {
  const state = {
    look: undefined as ((path: string) => void) | undefined,
    looked(path: unknown): void {
      const hook = state.look;
      state.look = undefined;
      hook?.(String(path));
    },
  };
  return state;
});

vi.mock("node:fs/promises", async (importOriginal) => {
  const real = await importOriginal<typeof FsPromises>();
  return {
    ...real,
    stat: async (...args: Parameters<typeof real.stat>) => {
      const info = await real.stat(...args);
      after.looked(args[0]);
      return info;
    },
    open: async (...args: Parameters<typeof real.open>) => {
      const handle = await real.open(...args);
      after.looked(args[0]);
      return handle;
    },
  };
});

let folder: string;

describe("FileSecretStoreDriver size check", () => {
  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), "secret-files-race-"));
  });

  afterEach(() => {
    after.look = undefined;
    rmSync(folder, { recursive: true, force: true });
  });

  it("refuses a file that grows past 64 KiB after it was checked, never reading it in unchecked", async () => {
    writeFileSync(join(folder, "API_KEY"), "small-canary\n");
    const grown = "x".repeat(64 * 1024 + 1);
    after.look = (path) => {
      if (basename(path) === "API_KEY") writeFileSync(path, grown);
    };
    const store = new FileSecretStoreDriver(
      buildConfig(SecretFilesConfig, { values: { directory: folder, names: ["API_KEY"] } }),
    );

    const failure = await store.load().then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(
      `The file secret store could not read in ${folder}: API_KEY (over 65536 bytes)`,
    );
    expect(() => store.get("API_KEY")).toThrow(/not loaded/);
  });
});

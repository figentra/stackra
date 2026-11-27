/**
 * Stackra file contract:
 * Purpose: unit tests of `FileSecretStoreDriver` on a real folder: it is the `SecretStore` port and throws before it
 *          is loaded; it reads every SCREAMING_SNAKE file (one trailing line break dropped) and skips the platform's
 *          own entries; with `names` it reads only those and fails on a missing one or a folder; it refuses a relative
 *          or empty folder, an unlistable one and a file over 64 KiB; a failed reload keeps the last good copy and a
 *          good one picks up a rotated file. No error carries a value.
 * Boundary: test only; files live in a temporary folder removed after each test. Values are made-up canaries.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173; ADR 0371 (amendment 2026-11-27, STA-258).
 */
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { SecretFilesConfig } from "#config/secret-files.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { buildConfig } from "#core/functions/build-config.function";
import { scheduleSecretReload } from "#core/functions/schedule-secret-reload.function";
import { FileSecretStoreDriver } from "#node/drivers/file-secret-store.driver";

let folder: string;

function store(values: Record<string, unknown>): FileSecretStoreDriver {
  return new FileSecretStoreDriver(buildConfig(SecretFilesConfig, { values }));
}

describe(FileSecretStoreDriver, () => {
  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), "secret-files-"));
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it("is a SecretStore that throws before it is loaded", () => {
    const driver = store({ directory: folder });
    expect(driver).toBeInstanceOf(SecretStore);
    expect(() => driver.get("X")).toThrow(/not loaded/);
  });

  it("reads every SCREAMING_SNAKE file, dropping one trailing line break, and skips the rest", async () => {
    writeFileSync(join(folder, "RESEND_API_KEY"), "resend-canary\n");
    writeFileSync(join(folder, "WINDOWS_KEY"), "crlf-canary\r\n");
    writeFileSync(join(folder, "MULTI_LINE"), "line-1\nline-2\n\n");
    writeFileSync(join(folder, ".hidden"), "hidden-canary");
    writeFileSync(join(folder, "lower"), "lower-canary");
    // Kubernetes mounts a Secret as `..data/` with symlinks to it; the folder is the platform's, not a secret.
    mkdirSync(join(folder, "..data"));
    mkdirSync(join(folder, "NOT_A_FILE"));
    writeFileSync(join(folder, "..data", "LINKED_KEY"), "linked-canary");
    symlinkSync(join(folder, "..data", "LINKED_KEY"), join(folder, "LINKED_KEY"));

    const driver = store({ directory: folder });
    await driver.load();
    expect(driver.get("RESEND_API_KEY")).toBe("resend-canary");
    expect(driver.get("WINDOWS_KEY")).toBe("crlf-canary");
    expect(driver.get("MULTI_LINE")).toBe("line-1\nline-2\n");
    expect(driver.get("LINKED_KEY")).toBe("linked-canary");
    expect(driver.get(".hidden")).toBeUndefined();
    expect(driver.get("lower")).toBeUndefined();
    expect(driver.get("NOT_A_FILE")).toBeUndefined();
  });

  it("reads only the named files, and fails naming a missing one or a folder", async () => {
    writeFileSync(join(folder, "WANTED_KEY"), "wanted-canary");
    writeFileSync(join(folder, "OTHER_KEY"), "other-canary");
    const driver = store({ directory: folder, names: ["WANTED_KEY"] });
    await driver.load();
    expect(driver.get("WANTED_KEY")).toBe("wanted-canary");
    expect(driver.get("OTHER_KEY")).toBeUndefined();

    mkdirSync(join(folder, "A_FOLDER"));
    const failed = store({
      directory: folder,
      names: ["WANTED_KEY", "GONE_KEY", "A_FOLDER"],
    }).load();
    await expect(failed).rejects.toThrow(
      `The file secret store could not read in ${folder}: GONE_KEY (missing), A_FOLDER (not a file)`,
    );
    await failed.catch((error: Error) => expect(error.message).not.toContain("canary"));
  });

  it("refuses an empty or relative folder, one it cannot list, and a file over 64 KiB", async () => {
    await expect(store({}).load()).rejects.toThrow(/needs an absolute directory/);
    await expect(store({ directory: "run/secrets" }).load()).rejects.toThrow(/absolute/);
    await expect(store({ directory: join(folder, "nowhere") }).load()).rejects.toThrow(
      `The file secret store cannot list ${join(folder, "nowhere")} (ENOENT)`,
    );
    writeFileSync(join(folder, "HUGE_KEY"), "x".repeat(64 * 1024 + 1));
    await expect(store({ directory: folder }).load()).rejects.toThrow(
      "HUGE_KEY (over 65536 bytes)",
    );
  });

  it("keeps the last good copy when a reload fails, and picks up a rotated file on the next", async () => {
    writeFileSync(join(folder, "SIGNING_KEY"), "first-canary");
    const driver = store({ directory: folder, names: ["SIGNING_KEY"] });
    await driver.load();

    rmSync(join(folder, "SIGNING_KEY"));
    await expect(driver.load()).rejects.toThrow("SIGNING_KEY (missing)");
    expect(driver.get("SIGNING_KEY")).toBe("first-canary");

    writeFileSync(join(folder, "SIGNING_KEY"), "rotated-canary");
    await driver.load();
    expect(driver.get("SIGNING_KEY")).toBe("rotated-canary");
  });

  it("follows a Kubernetes Secret volume's atomic swap on reload, with no restart", async () => {
    // The kubelet's layout: each key links to `..data/<key>`, and `..data` links to a timestamped folder it swaps.
    const write = (version: string, value: string): void => {
      mkdirSync(join(folder, version));
      writeFileSync(join(folder, version, "SIGNING_KEY"), value);
    };
    write("..2026_11_27_01", "before-canary");
    symlinkSync("..2026_11_27_01", join(folder, "..data"));
    symlinkSync("..data/SIGNING_KEY", join(folder, "SIGNING_KEY"));
    const driver = store({ directory: folder });
    await driver.load();
    const reload = scheduleSecretReload(driver, { everySeconds: 0 });
    expect(driver.get("SIGNING_KEY")).toBe("before-canary");

    write("..2026_11_27_02", "after-canary");
    symlinkSync("..2026_11_27_02", join(folder, "..data_tmp"));
    renameSync(join(folder, "..data_tmp"), join(folder, "..data"));
    expect(driver.get("SIGNING_KEY")).toBe("before-canary");
    await expect(reload.reloadNow()).resolves.toBe(true);
    expect(driver.get("SIGNING_KEY")).toBe("after-canary");
  });
});

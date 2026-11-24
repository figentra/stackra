/**
 * Stackra file contract:
 * Purpose: proves `create.mjs` keeps its template cache under `XDG_CACHE_HOME` when that is set, and copies a cache that
 *   is already there into the target without starting docker: a box that points caches elsewhere must not get a
 *   second copy in the user's home.
 * Boundary: runs `create.mjs` as a child process with a pre-built fake cache in a temporary folder; no docker, no network.
 * Runtime: node (`node --test`)
 * Governing contract: STA-2709 (the owner's method rules; fair, reproducible baselines).
 * Input: a temporary XDG_CACHE_HOME holding `stk-bench/nestjs-<version>/node_modules/`.
 * Output: pass or fail.
 * Secrets: none.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const baseline = join(here, "..");
const { version } = JSON.parse(readFileSync(join(baseline, "framework.json"), "utf8"));

test("create.mjs reads its template cache from XDG_CACHE_HOME and never starts docker for a cached template", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "stk-create-cache-"));
  try {
    const cache = join(sandbox, "xdg", "stk-bench", `nestjs-${version}`);
    mkdirSync(join(cache, "node_modules"), { recursive: true });
    writeFileSync(join(cache, "node_modules", "marker.txt"), "from the cache");
    writeFileSync(join(cache, "package.json"), '{"name":"cached-starter"}');
    const target = join(sandbox, "app");
    // A `docker` that records its use, first on the PATH: the run must never call it.
    const bin = join(sandbox, "bin");
    mkdirSync(bin);
    writeFileSync(
      join(bin, "docker"),
      `#!/bin/sh\necho called > "${join(sandbox, "docker-called")}"\nexit 1\n`,
      {
        mode: 0o755,
      },
    );
    const ran = spawnSync(process.execPath, [join(baseline, "create.mjs"), target], {
      env: {
        PATH: `${bin}:${process.env.PATH}`,
        HOME: join(sandbox, "home"),
        XDG_CACHE_HOME: join(sandbox, "xdg"),
      },
      encoding: "utf8",
    });
    assert.equal(ran.status, 0, ran.stderr);
    assert.ok(
      existsSync(join(target, "node_modules", "marker.txt")),
      "the cached template was copied in",
    );
    assert.ok(existsSync(join(target, "src", "main.ts")), "the starting app was laid over it");
    assert.ok(!existsSync(join(sandbox, "docker-called")), "docker was not started");
    assert.ok(
      !existsSync(join(sandbox, "home", ".cache")),
      "nothing was cached under the home directory",
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("create.mjs asks npm to resolve every dependency as of the date framework.json names", () => {
  const { resolveBefore } = JSON.parse(readFileSync(join(baseline, "framework.json"), "utf8"));
  assert.match(
    String(resolveBefore),
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    "framework.json names the date",
  );
  const sandbox = mkdtempSync(join(tmpdir(), "stk-create-before-"));
  try {
    // No cache, so the first-call path runs; a `docker` that records its arguments and fails stands in for it.
    const bin = join(sandbox, "bin");
    mkdirSync(bin);
    const recorded = join(sandbox, "docker-args");
    writeFileSync(join(bin, "docker"), `#!/bin/sh\nprintf '%s\\n' "$@" > "${recorded}"\nexit 1\n`, {
      mode: 0o755,
    });
    const ran = spawnSync(process.execPath, [join(baseline, "create.mjs"), join(sandbox, "app")], {
      env: {
        PATH: `${bin}:${process.env.PATH}`,
        HOME: join(sandbox, "home"),
        XDG_CACHE_HOME: join(sandbox, "xdg"),
      },
      encoding: "utf8",
    });
    assert.notEqual(ran.status, 0, "the stand-in docker failed, so the build fails");
    const args = readFileSync(recorded, "utf8").split("\n");
    const at = args.indexOf(`npm_config_before=${resolveBefore}`);
    assert.ok(
      at > 0 && args[at - 1] === "-e",
      "the container gets npm_config_before as an environment variable",
    );
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

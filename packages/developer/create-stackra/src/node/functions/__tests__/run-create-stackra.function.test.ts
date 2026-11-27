/**
 * Stackra file contract:
 * Purpose: unit tests of `runCreateStackra` against a fake host: it starts npm's own `npx-cli.js` with the scope
 *          mapping as an npx flag (never an `.npmrc`), `@stackra/cli@<cli> create` and the forwarded arguments, sets
 *          `STACKRA_REGISTRY` for the child, returns the child's exit code, and answers help, usage errors, an old
 *          Node and an npx that cannot start with 0, 2, 1 and 127.
 * Boundary: no process is started; the fake records the one call.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { runCreateStackra } from "#node/functions/run-create-stackra.function";
import type { BootstrapEnv } from "#node/types/bootstrap-env.type";
import type { BootstrapHost } from "#node/types/bootstrap-host.type";

const NPX_CLI = "/opt/node/lib/node_modules/npm/bin/npx-cli.js";

/** A fake host and what it saw. */
function fakeHost(overrides: Partial<BootstrapHost> = {}) {
  const seen = {
    out: [] as string[],
    err: [] as string[],
    runs: [] as { command: string; args: readonly string[]; env: BootstrapEnv }[],
  };
  const host: BootstrapHost = {
    env: { PATH: "/usr/bin" },
    nodeVersion: "24.22.0",
    execPath: "/opt/node/bin/node",
    platform: "linux",
    exists: (path) => path === NPX_CLI,
    out: (line) => seen.out.push(line),
    err: (line) => seen.err.push(line),
    run: async (command, args, env) => {
      seen.runs.push({ command, args, env });
      return 0;
    },
    ...overrides,
  };
  return { host, seen };
}

describe("runCreateStackra", () => {
  it("runs @stackra/cli create through npx with the @stackra scope mapped for this run only", async () => {
    const { host, seen } = fakeHost();
    expect(await runCreateStackra(["my-app", "--yes"], host)).toBe(0);
    expect(seen.runs).toHaveLength(1);
    const [run] = seen.runs;
    expect(run?.command).toBe("/opt/node/bin/node");
    expect(run?.args).toEqual([
      NPX_CLI,
      "--yes",
      "--@stackra:registry=https://npm.stackra.figentra.com/",
      "@stackra/cli@latest",
      "create",
      "my-app",
      "--yes",
    ]);
    expect(run?.env).toEqual({
      PATH: "/usr/bin",
      STACKRA_REGISTRY: "https://npm.stackra.figentra.com/",
    });
    expect(seen.out.join("\n")).toContain("@stackra/* from https://npm.stackra.figentra.com/");
  });

  it("takes the registry from --registry, else STACKRA_REGISTRY, and the CLI version from --cli", async () => {
    const fromEnv = fakeHost({ env: { STACKRA_REGISTRY: "https://mirror.test/npm" } });
    await runCreateStackra(["my-app"], fromEnv.host);
    expect(fromEnv.seen.runs[0]?.args[2]).toBe("--@stackra:registry=https://mirror.test/npm/");
    expect(fromEnv.seen.runs[0]?.env["STACKRA_REGISTRY"]).toBe("https://mirror.test/npm/");

    const fromFlag = fakeHost({ env: { STACKRA_REGISTRY: "https://mirror.test/npm" } });
    await runCreateStackra(
      ["--registry", "http://localhost:8787", "my-app", "--cli=0.33.0"],
      fromFlag.host,
    );
    expect(fromFlag.seen.runs[0]?.args.slice(1)).toEqual([
      "--yes",
      "--@stackra:registry=http://localhost:8787/",
      "@stackra/cli@0.33.0",
      "create",
      "my-app",
    ]);
    expect(fromFlag.seen.runs[0]?.env["STACKRA_REGISTRY"]).toBe("http://localhost:8787/");
  });

  it("returns the child's exit code", async () => {
    const { host } = fakeHost({ run: async () => 3 });
    expect(await runCreateStackra(["my-app"], host)).toBe(3);
  });

  it("prints its help without starting anything", async () => {
    const { host, seen } = fakeHost();
    expect(await runCreateStackra(["--help"], host)).toBe(0);
    expect(seen.runs).toEqual([]);
    expect(seen.out.join("\n")).toContain("npm create stackra@latest <folder>");
  });

  it("answers a usage error with 2 and starts nothing", async () => {
    const { host, seen } = fakeHost();
    expect(await runCreateStackra(["my-app", "--registry", "ftp://x.test"], host)).toBe(2);
    expect(await runCreateStackra(["my-app", "--cli"], host)).toBe(2);
    expect(seen.runs).toEqual([]);
    expect(seen.err[0]).toBe("create-stackra: the registry is not an http(s) URL: ftp://x.test");
  });

  it("refuses a Node older than 24 before anything else", async () => {
    const { host, seen } = fakeHost({ nodeVersion: "20.19.0" });
    expect(await runCreateStackra(["my-app"], host)).toBe(1);
    expect(seen.runs).toEqual([]);
    expect(seen.err[0]).toContain("needs Node.js 24 or later; this is 20.19.0");
  });

  it("prints the line to run by hand when npx cannot start", async () => {
    const enoent = fakeHost({
      run: async () => {
        throw new Error("spawn npx ENOENT");
      },
      exists: () => false,
    });
    expect(await runCreateStackra(["my app"], enoent.host)).toBe(127);
    expect(enoent.seen.err).toEqual([
      "create-stackra: npx could not start (spawn npx ENOENT). Run instead:",
      "  npx --yes --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli@latest create 'my app'",
    ]);

    const windows = fakeHost({ platform: "win32", exists: () => false });
    expect(await runCreateStackra(["my-app"], windows.host)).toBe(127);
    expect(windows.seen.runs).toEqual([]);
    expect(windows.seen.err[0]).toContain("npx was not found");
  });

  it("lets an unexpected error through", async () => {
    const { host } = fakeHost({
      env: new Proxy(
        {},
        {
          get: () => {
            throw new TypeError("broken env");
          },
        },
      ),
    });
    await expect(runCreateStackra(["my-app"], host)).rejects.toThrow("broken env");
  });
});

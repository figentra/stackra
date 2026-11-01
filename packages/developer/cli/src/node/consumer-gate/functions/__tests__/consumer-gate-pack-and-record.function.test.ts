/**
 * Stackra file contract:
 * Purpose: unit tests of the consumer gate's pack mode, leak check, environment record and setup rules:
 *          `coreTarballLinks` with `linkConsumerWorkspace`, `listCorePacks`, `collectSourceTargets`,
 *          `judgeConsumerGateLeak`, `inspectConsumerGateLeaks`, `buildConsumerGateEnvironment`,
 *          `consumerGateReproduce`, and `runConsumerGate` (repo-own window, exit 2 setup errors, pack mode summary).
 * Boundary: test only; temporary directories and a fake executor, no pnpm, no git, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1813.
 */
// @covers sta-1813:FR-002 sta-1813:FR-004 sta-1813:FR-005 sta-1813:FR-007 sta-1813:FR-010 sta-1813:FR-011
// @covers sta-1813:FR-012 sta-1813:FR-013
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { buildConsumerGateEnvironment } from "#node/consumer-gate/functions/build-consumer-gate-environment.function";
import { collectSourceTargets } from "#node/consumer-gate/functions/collect-source-targets.function";
import { consumerGateReproduce } from "#node/consumer-gate/functions/consumer-gate-reproduce.function";
import { coreTarballLinks } from "#node/consumer-gate/functions/core-tarball-links.function";
import { inspectConsumerGateLeaks } from "#node/consumer-gate/functions/inspect-consumer-gate-leaks.function";
import { judgeConsumerGateLeak } from "#node/consumer-gate/functions/judge-consumer-gate-leak.function";
import { linkConsumerWorkspace } from "#node/consumer-gate/functions/link-consumer-workspace.function";
import { listCorePacks } from "#node/consumer-gate/functions/list-core-packs.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";
import { loadConsumerGateMatrix } from "#node/consumer-gate/functions/load-consumer-gate-matrix.function";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const write = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

describe("pack mode rows", () => {
  it("names the tarball pnpm pack writes and rewrites catalog and overrides to file: rows", () => {
    const links = coreTarballLinks([{ name: "@stackra/model", version: "0.3.0" }], "/out/tarballs");
    expect(links).toEqual({ "@stackra/model": "file:/out/tarballs/stackra-model-0.3.0.tgz" });
    const text = linkConsumerWorkspace(
      'catalog:\n  "@stackra/model": 0.3.0\n  zod: 4.1.0\n',
      links,
    );
    expect(text).toMatch(
      /^ {2}"@stackra\/model": "file:\/out\/tarballs\/stackra-model-0\.3\.0\.tgz"$/m,
    );
    expect(text).toMatch(/^overrides:\n {2}"@stackra\/model": "file:/m);
    expect(text).toMatch(/^ {2}zod: 4\.1\.0$/m);
  });

  it("lists only publishable core packages", () => {
    const dir = mkdtempSync(join(tmpdir(), "consumer-gate-packs-"));
    dirs.push(dir);
    write(
      join(dir, "packages/data/model/package.json"),
      '{"name":"@stackra/model","version":"0.3.0"}',
    );
    write(
      join(dir, "packages/data/hidden/package.json"),
      '{"name":"@stackra/hidden","private":true}',
    );
    write(join(dir, "packages/data/other/package.json"), '{"name":"@x/other"}');
    expect(listCorePacks(dir).map((pack) => `${pack.name}@${pack.version}`)).toEqual([
      "@stackra/model@0.3.0",
    ]);
  });
});

describe("the leak judgement", () => {
  it("collects @stackra/source targets at any depth", () => {
    expect(
      collectSourceTargets({
        ".": { "@stackra/source": "./src/index.ts", default: "./dist/index.js" },
        "./node": { import: { "@stackra/source": "./src/node/index.ts" } },
      }),
    ).toEqual(["./src/index.ts", "./src/node/index.ts"]);
    expect(collectSourceTargets(undefined)).toEqual([]);
  });

  it("is empty when nothing leaks and names each core path and absent source", () => {
    expect(
      judgeConsumerGateLeak({ core: "/core", resolved: ["/w/node_modules/x"], missingSources: [] }),
    ).toEqual([]);
    expect(
      judgeConsumerGateLeak({
        core: "/core",
        resolved: ["/core/packages/a/dist/x.js", "/corex/y", "/w/y"],
        missingSources: ["@stackra/a ./src/index.ts"],
      }),
    ).toEqual([
      "resolves into the core tree: /core/packages/a/dist/x.js",
      "@stackra/source points at a file not in the tarball: @stackra/a ./src/index.ts",
    ]);
  });

  it("inspects an installed tree: a symlink into core and an absent source file are findings", () => {
    const dir = mkdtempSync(join(tmpdir(), "consumer-gate-leak-"));
    dirs.push(dir);
    write(join(dir, "core/packages/data/model/index.js"), "");
    write(
      join(dir, "w/node_modules/@stackra/clean/package.json"),
      '{"exports":{".":"./dist/i.js"}}',
    );
    write(join(dir, "w/node_modules/@stackra/clean/dist/i.js"), "");
    expect(inspectConsumerGateLeaks(join(dir, "w"), join(dir, "core"))).toEqual([]);
    write(
      join(dir, "w/node_modules/@stackra/src/package.json"),
      '{"exports":{".":{"@stackra/source":"./src/index.ts"}}}',
    );
    symlinkSync(join(dir, "core/packages/data/model"), join(dir, "w/node_modules/@stackra/linked"));
    const findings = inspectConsumerGateLeaks(join(dir, "w"), join(dir, "core"));
    expect(findings.some((line) => line.startsWith("resolves into the core tree"))).toBe(true);
    expect(findings.some((line) => line.includes("@stackra/src ./src/index.ts"))).toBe(true);
  });
});

describe("the environment record", () => {
  it("normalises pnpm and sorts overlay hashes, and keeps both lockfile hashes", () => {
    const env = buildConsumerGateEnvironment({
      coreCommit: "c0re",
      productRef: "abc1234",
      mode: "pack",
      node: "v24.0.0",
      pnpmOutput: "10.1.0\n",
      lockfileBefore: "aa",
      lockfileAfter: "bb",
      gen: "0.3.0",
      overlays: { tenancy: "t", invoicing: "i" },
      reproduce: "stackra consumer-gate --product x",
    });
    expect(env.pnpm).toBe("10.1.0");
    expect(Object.keys(env.overlays)).toEqual(["invoicing", "tenancy"]);
    expect(env.lockfileBefore).toBe("aa");
    expect(env.lockfileAfter).toBe("bb");
    expect(buildConsumerGateEnvironment({ ...env, pnpmOutput: "\n" }).pnpm).toBeUndefined();
  });

  it("builds a reproduce line in a fixed flag order, quoting what needs it", () => {
    expect(
      consumerGateReproduce({
        product: "pay",
        core: "/my core",
        out: "/o",
        mode: "pack",
        "dry-run": true,
        today: undefined,
      }),
    ).toBe("stackra consumer-gate --core '/my core' --product pay --out /o --mode pack --dry-run");
  });
});

const TODAY = "2026-11-01";

/** A core tree, a product with one service and a validate script, an overlay and a tenancy overlay folder. */
function fixture(extraMatrix = "") {
  const dir = mkdtempSync(join(tmpdir(), "consumer-gate-run-"));
  dirs.push(dir);
  write(
    join(dir, "core/packages/data/model/package.json"),
    '{"name":"@stackra/model","version":"0.3.0"}',
  );
  write(join(dir, "core/packages/data/model/dist/index.js"), "");
  write(
    join(dir, "core/packages/developer/gen/package.json"),
    '{"name":"@stackra/gen","version":"0.3.5"}',
  );
  write(join(dir, "checkout/pnpm-workspace.yaml"), 'catalog:\n  "@stackra/model": 0.3.0\n');
  write(join(dir, "checkout/pnpm-lock.yaml"), "lock\n");
  write(join(dir, "checkout/package.json"), '{"scripts":{"validate":"x","format:check":"x"}}');
  write(join(dir, "checkout/services/billing/package.json"), '{"name":"@p/billing"}');
  write(join(dir, "overlays/tenancy/stackra.manifest.json"), "{}");
  const matrix = loadConsumerGateMatrix(
    `products:\n  billing:\n    repo: a/b\n    ref: abc1234\n    services: [billing]\n    overlays: [tenancy]\n${extraMatrix}`,
  );
  const options = {
    core: join(dir, "core"),
    checkout: join(dir, "checkout"),
    product: "billing",
    out: join(dir, "out"),
    matrix,
    allow: loadConsumerGateAllow("allow: []\n", TODAY),
    overlays: join(dir, "overlays"),
    today: TODAY,
    reproduce: "stackra consumer-gate --product billing",
  };
  return { dir, options };
}

const head = (dir: string): string => (dir.endsWith("checkout") ? "abc1234ffff" : "core0000");

const ok: ConsumerGateDeps["exec"] = (argv, { logFile }) => {
  writeFileSync(logFile, argv[1] === "--version" ? "10.9.0\n" : "fine\n");
  return 0;
};

const failGit: ConsumerGateDeps["exec"] = (argv, { logFile }) => {
  writeFileSync(logFile, "boom\n");
  return argv[0] === "git" ? 1 : 0;
};

describe("runConsumerGate setup rules (exit 2)", () => {
  const deps = { exec: ok, head };

  it("refuses an unbuilt core, naming the build command", () => {
    const { dir, options } = fixture();
    rmSync(join(dir, "core/packages/data/model/dist"), { recursive: true });
    const result = runConsumerGate(options, deps);
    expect(result.code).toBe(2);
    expect(result.error).toMatch(/core is not built.*turbo run build/);
  });

  it("refuses unknown services, traversal, an unknown or odd product, and a scaffold", () => {
    const { options } = fixture(
      "  scaffold:\n    kind: scaffold\n    fixture: f\n    services: [x]\n",
    );
    expect(runConsumerGate({ ...options, services: ["nope"] }, deps).code).toBe(2);
    expect(runConsumerGate({ ...options, services: ["../../x"] }, deps).error).toMatch(
      /no service/,
    );
    expect(runConsumerGate({ ...options, product: "../x" }, deps).code).toBe(2);
    expect(runConsumerGate({ ...options, product: "constructor" }, deps).code).toBe(2);
    const scaffold = runConsumerGate({ ...options, product: "scaffold" }, deps);
    expect(scaffold.code).toBe(2);
    expect(scaffold.error).toMatch(/scaffold is not yet supported/);
  });

  it("refuses missing overlays, an empty plan, an --out inside a tree and a refused allow entry", () => {
    const { dir, options } = fixture();
    const { overlays: _overlays, ...without } = options;
    expect(runConsumerGate(without, deps).error).toMatch(/pass --overlays/);
    expect(runConsumerGate({ ...options, steps: ["leak"] }, deps).error).toMatch(/no step to run/);
    expect(runConsumerGate({ ...options, out: join(dir, "checkout/out") }, deps).error).toMatch(
      /inside the checkout or the core tree/,
    );
    expect(runConsumerGate({ ...options, out: join(dir, "core/out") }, deps).code).toBe(2);
    const refused = loadConsumerGateAllow(
      `allow:\n  - ${JSON.stringify({ product: "billing", step: "test", class: "tenant-isolation", match: "TS2589", issue: "STA-1", added: "2026-10-30", expires: "2026-11-10" })}\n`,
      TODAY,
    );
    expect(runConsumerGate({ ...options, allow: refused }, deps).error).toMatch(
      /never be allow-listed/,
    );
  });

  it("exits 2 when the scratch copy fails, and when the checkout lacks a workspace file", () => {
    const { dir, options } = fixture();
    expect(runConsumerGate(options, { exec: failGit, head }).error).toMatch(/git init failed/);
    rmSync(join(dir, "checkout/pnpm-workspace.yaml"));
    expect(runConsumerGate(options, deps).code).toBe(2);
  });
});

describe("runConsumerGate repo-own window", () => {
  it("runs validate and format with the product's own workspace and without overlay-only services, then restores", () => {
    const { options } = fixture();
    const seen: Record<string, { workspace: string; tenancy: boolean }> = {};
    const exec: ConsumerGateDeps["exec"] = (argv, { cwd, logFile }) => {
      writeFileSync(logFile, "fine\n");
      if (argv[2] === "validate" || argv[2] === "format:check") {
        seen[argv[2]] = {
          workspace: readFileSync(join(cwd, "pnpm-workspace.yaml"), "utf8"),
          tenancy: existsSync(join(cwd, "services/tenancy")),
        };
      }
      return 0;
    };
    const result = runConsumerGate(options, { exec, head });
    expect(result.code).toBe(0);
    for (const step of ["validate", "format:check"]) {
      expect(seen[step]?.workspace).not.toContain("link:");
      expect(seen[step]?.tenancy).toBe(false);
    }
    const work = join(options.out, "work/billing@abc1234");
    expect(readFileSync(join(work, "pnpm-workspace.yaml"), "utf8")).toContain("link:");
    expect(existsSync(join(work, "services/tenancy/stackra.manifest.json"))).toBe(true);
    expect(result.summary?.steps.find((step) => step.id === "spell")?.status).toBe("skipped");
    expect(result.summary?.steps.find((step) => step.id === "format")?.status).toBe("pass");
  });
});

const soundTree: ConsumerGateDeps["exec"] = (argv, where) => {
  if (argv[1] === "install") {
    write(
      join(where.cwd, "node_modules/@stackra/model/package.json"),
      '{"exports":{".":"./dist/i.js"}}',
    );
    write(join(where.cwd, "node_modules/@stackra/model/dist/i.js"), "");
    write(join(where.cwd, "pnpm-lock.yaml"), "new lock\n");
  }
  if (argv[1] === "status") {
    writeFileSync(where.logFile, " M services/billing/src/gen.ts\n");
    return 0;
  }
  return ok(argv, where);
};

describe("runConsumerGate pack mode and the environment record", () => {
  it("packs every publishable package under --out, rewrites to file: rows, and records the environment", () => {
    const { options } = fixture();
    const calls: string[][] = [];
    const exec: ConsumerGateDeps["exec"] = (argv, where) => {
      calls.push([...argv]);
      return ok(argv, where);
    };
    const result = runConsumerGate({ ...options, mode: "pack" }, { exec, head });
    const work = join(options.out, "work/billing@abc1234");
    expect(readFileSync(join(work, "pnpm-workspace.yaml"), "utf8")).toContain(
      `file:${join(options.out, "tarballs")}/stackra-model-0.3.0.tgz`,
    );
    const pack = calls.find((argv) => argv[1] === "pack");
    expect(pack).toEqual(["pnpm", "pack", "--pack-destination", join(options.out, "tarballs")]);
    expect(result.summary?.steps.find((step) => step.id === "core-pack")?.status).toBe("pass");
    // The tarballs are fake, so nothing is installed and the leak check finds no @stackra packages.
    expect(result.summary?.steps.find((step) => step.id === "leak")).toMatchObject({
      status: "fail",
      uncovered: ["no @stackra packages are installed"],
    });
    expect(result.code).toBe(1);
    const json = JSON.parse(
      readFileSync(join(options.out, "summary-billing@abc1234.json"), "utf8"),
    );
    expect(json.mode).toBe("pack");
    expect(json.environment).toMatchObject({
      coreCommit: "core0000",
      productRef: "abc1234",
      mode: "pack",
      node: process.version,
      pnpm: "10.9.0",
      gen: "0.3.5",
      reproduce: "stackra consumer-gate --product billing",
    });
    expect(json.environment.lockfileBefore).toMatch(/^[0-9a-f]{64}$/);
    expect(json.environment.overlays.tenancy).toMatch(/^[0-9a-f]{64}$/);
    expect(readFileSync(join(options.out, "summary-billing@abc1234.md"), "utf8")).toMatch(
      /Environment:[\s\S]*reproduce:/,
    );
  });

  it("records a clean leak check, and gen drift, when the tree is sound", () => {
    const { options } = fixture();
    const result = runConsumerGate({ ...options, mode: "pack" }, { exec: soundTree, head });
    expect(result.summary?.steps.find((step) => step.id === "leak")?.status).toBe("pass");
    expect(result.code).toBe(0);
    expect(result.summary?.genDrift?.changes).toBe(1);
    expect(result.summary?.environment.lockfileAfter).toMatch(/^[0-9a-f]{64}$/);
    expect(result.summary?.environment.lockfileAfter).not.toBe(
      result.summary?.environment.lockfileBefore,
    );
  });

  it("keys summaries by pin so per-pin runs do not overwrite each other", () => {
    const { options } = fixture();
    const matrix = loadConsumerGateMatrix(
      "products:\n  billing:\n    repo: a/b\n    pins: { billing: abc1234, usage: def5678 }\n    services: [billing, usage]\n",
    );
    const result = runConsumerGate(
      { ...options, matrix, services: ["billing"] },
      { exec: ok, head },
    );
    expect(result.summary?.key).toBe("billing@abc1234~billing");
    expect(existsSync(join(options.out, "summary-billing@abc1234~billing.json"))).toBe(true);
  });
});

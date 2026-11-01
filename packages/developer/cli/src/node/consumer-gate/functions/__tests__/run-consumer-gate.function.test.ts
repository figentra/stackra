/**
 * Stackra file contract:
 * Purpose: unit tests of the consumer gate's runner and its pure parts: `loadConsumerGateMatrix` (and the committed
 *          matrix, including per-service pins), `resolveConsumerGateRef`, `linkConsumerWorkspace`,
 *          `planConsumerGateSteps`, and `runConsumerGate` with a fake executor.
 * Boundary: test only; temporary directories and a fake executor, no pnpm, no git, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1813.
 */
// @covers sta-1813:FR-001 sta-1813:FR-002 sta-1813:FR-003 sta-1813:FR-004 sta-1813:FR-006 sta-1813:FR-007
// @covers sta-1813:P-001 sta-1813:P-002 sta-1813:P-003 sta-1813:P-004 sta-1813:P-006
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { linkConsumerWorkspace } from "#node/consumer-gate/functions/link-consumer-workspace.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";
import { loadConsumerGateMatrix } from "#node/consumer-gate/functions/load-consumer-gate-matrix.function";
import { planConsumerGateSteps } from "#node/consumer-gate/functions/plan-consumer-gate-steps.function";
import { resolveConsumerGateRef } from "#node/consumer-gate/functions/resolve-consumer-gate-ref.function";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";

const TODAY = "2026-11-01";
const REPOSITORY_ROOT = resolve(import.meta.dirname, "../../../../../../../..");
const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const write = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const allowOf = (...lines: string[]) =>
  loadConsumerGateAllow(`allow:\n${lines.map((line) => `  - ${line}`).join("\n")}\n`, TODAY);

const ALLOW_TS6133 = JSON.stringify({
  product: "billing",
  step: "typecheck",
  class: "product",
  match: "TS6133",
  issue: "STA-1",
  added: "2026-10-30",
  expires: "2026-11-10",
});

describe("loadConsumerGateMatrix", () => {
  it("loads the committed matrix with per-service pins for billing", () => {
    const matrix = loadConsumerGateMatrix(
      readFileSync(join(REPOSITORY_ROOT, "tools/consumer-gate/matrix.yaml"), "utf8"),
    );
    expect(Object.keys(matrix)).toEqual(["billing", "pay", "invoicing", "tamo", "scaffold"]);
    expect(matrix["billing"]?.pins).toEqual({
      billing: "1139925",
      entitlements: "c605e78",
      usage: "aacd450",
    });
    expect(matrix["pay"]?.services).toEqual(["payments", "payments-ledger"]);
    expect(matrix["tamo"]?.overlays).toEqual(["identity"]);
  });

  it("refuses a bad shape with the product's name", () => {
    expect(() =>
      loadConsumerGateMatrix("products:\n  x:\n    repo: a/b\n    services: [s]\n"),
    ).toThrow(/x needs repo and ref/);
    expect(() =>
      loadConsumerGateMatrix("products:\n  x:\n    repo: a/b\n    ref: abc1234\n"),
    ).toThrow(/x needs a non-empty/);
    expect(() =>
      loadConsumerGateMatrix(
        "products:\n  x:\n    repo: a/b\n    ref: abc1234\n    services: [s]\n    steps: [nope]\n",
      ),
    ).toThrow(/unknown step nope/);
    expect(() =>
      loadConsumerGateMatrix(
        "products:\n  x:\n    repo: a/b\n    pins: { s: abc1234 }\n    services: [s, t]\n",
      ),
    ).toThrow(/no pin for service t/);
  });
});

describe("resolveConsumerGateRef", () => {
  const product = {
    repo: "a/b",
    pins: { x: "111", y: "222", z: "111" },
    services: ["x", "y", "z"],
  };

  it("takes the one ref, or the common pin of the services gated", () => {
    expect(resolveConsumerGateRef({ repo: "a/b", ref: "abc", services: ["x"] }, ["x"])).toEqual({
      ref: "abc",
    });
    expect(resolveConsumerGateRef(product, ["x", "z"])).toEqual({ ref: "111" });
  });

  it("refuses services pinned to different commits", () => {
    expect(resolveConsumerGateRef(product, ["x", "y"])).toEqual({
      error: expect.stringMatching(/different commits \(111, 222\).*--services/),
    });
  });
});

describe("linkConsumerWorkspace", () => {
  const links = {
    "@stackra/model": "link:/core/packages/data/model",
    "@stackra/gen": "link:/core/packages/developer/gen",
  };

  it("rewrites core catalog rows and adds overrides, leaving the rest alone", () => {
    const text = 'catalog:\n  "@stackra/model": 0.3.0\n  zod: 4.1.0\n  "@stackra/other": 1.0.0\n';
    const out = linkConsumerWorkspace(text, links);
    expect(out).toMatch(/^ {2}"@stackra\/model": "link:\/core\/packages\/data\/model"$/m);
    expect(out).toMatch(/^ {2}zod: 4\.1\.0$/m);
    expect(out).toMatch(/^ {2}"@stackra\/other": 1\.0\.0$/m);
    expect(out).toMatch(/^overrides:\n {2}"@stackra\/model"/m);
    expect(linkConsumerWorkspace("overrides:\n  x: 1\n", links)).toMatch(
      /^overrides:\n {2}"@stackra\/model": .*\n {2}"@stackra\/gen": .*\n {2}x: 1/m,
    );
  });
});

/** A core tree with one package, a product with two services (one with test:int) and an overlay manifest. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "consumer-gate-"));
  dirs.push(dir);
  write(join(dir, "core/packages/data/model/package.json"), '{"name":"@stackra/model"}');
  write(join(dir, "core/packages/data/model/dist/index.js"), "");
  write(join(dir, "checkout/pnpm-workspace.yaml"), 'catalog:\n  "@stackra/model": 0.3.0\n');
  write(join(dir, "checkout/pnpm-lock.yaml"), "lock\n");
  write(join(dir, "checkout/package.json"), '{"scripts":{"validate":"x"}}');
  write(join(dir, "checkout/node_modules/x/index.js"), "");
  write(
    join(dir, "checkout/services/billing/package.json"),
    '{"name":"@p/billing","scripts":{"test:int":"x"}}',
  );
  write(join(dir, "checkout/services/entitlements/package.json"), '{"name":"@p/entitlements"}');
  write(join(dir, "overlays/tenancy/stackra.manifest.json"), "{}");
  const matrix = loadConsumerGateMatrix(
    "products:\n  billing:\n    repo: a/b\n    ref: abc1234\n    services: [billing, entitlements]\n    overlays: [tenancy]\n",
  );
  const options = {
    core: join(dir, "core"),
    checkout: join(dir, "checkout"),
    product: "billing",
    out: join(dir, "out"),
    matrix,
    allow: allowOf(),
    overlays: join(dir, "overlays"),
    today: TODAY,
  };
  return { dir, options };
}

const head = (dir: string): string => (dir.endsWith("checkout") ? "abc1234ffff" : "core0000");

const fake =
  (fails: (argv: readonly string[]) => string | undefined): ConsumerGateDeps["exec"] =>
  (argv, { logFile }) => {
    const failure = fails(argv);
    writeFileSync(logFile, failure ?? "fine\n");
    return failure === undefined ? 0 : 1;
  };

describe("planConsumerGateSteps", () => {
  it("is ordered and skips test:int and validate when the product lacks the script", () => {
    const { dir } = fixture();
    const ids = (steps: string[]) =>
      planConsumerGateSteps({
        root: join(dir, "checkout"),
        services: ["billing", "entitlements"],
        steps,
      }).map(({ id, skip }) => (skip === undefined ? id : `${id}!`));
    expect(
      ids(["install", "build-deps", "gen", "typecheck", "test", "test:int", "validate"]),
    ).toEqual([
      "install",
      "build-deps",
      "gen/billing",
      "gen/entitlements",
      "typecheck",
      "test",
      "test:int/billing",
      "test:int/entitlements!",
      "validate",
    ]);
    expect(ids(["typecheck"])).toEqual(["typecheck"]);
  });
});

describe("runConsumerGate", () => {
  const failTypecheck = fake((argv) =>
    argv.includes("typecheck") ? "a.ts(1,1): error TS6133 'A'\n" : undefined,
  );
  const failInstall = fake((argv) => (argv[1] === "install" ? "ERR_PNPM_X\n" : undefined));

  it("overlays a scratch copy, writes both summaries and exits by the step results", () => {
    const { dir, options } = fixture();
    const red = runConsumerGate(options, { exec: failTypecheck, head });
    expect(red.code).toBe(1);
    const work = join(options.out, "work/billing@abc1234");
    expect(existsSync(join(work, "pnpm-lock.yaml"))).toBe(false);
    expect(existsSync(join(work, "node_modules"))).toBe(false);
    expect(readFileSync(join(work, "pnpm-workspace.yaml"), "utf8")).toMatch(
      /"@stackra\/model": "link:.*packages\/data\/model"/,
    );
    expect(existsSync(join(work, "services/tenancy/stackra.manifest.json"))).toBe(true);
    expect(readFileSync(join(dir, "checkout/pnpm-lock.yaml"), "utf8")).toBe("lock\n");
    const json = JSON.parse(
      readFileSync(join(options.out, "summary-billing@abc1234.json"), "utf8"),
    );
    expect(json.checkout.sha).toBe("abc1234ffff");
    expect(json.core.sha).toBe("core0000");
    expect(json.ref).toBe("abc1234");
    expect(json.steps.find((step: { id: string }) => step.id === "typecheck").status).toBe("fail");
    expect(readFileSync(join(options.out, "summary-billing@abc1234.md"), "utf8")).toMatch(
      /\| typecheck \| FAIL \|/,
    );
    expect(existsSync(join(options.out, "logs/billing@abc1234/typecheck.log"))).toBe(true);
    const green = runConsumerGate(
      { ...options, allow: allowOf(ALLOW_TS6133) },
      { exec: failTypecheck, head },
    );
    expect(green.code).toBe(0);
    expect(green.summary?.steps.find((step) => step.id === "typecheck")?.status).toBe("allowed");
  });

  it("skips the rest after a failed install and exits 2 on setup errors", () => {
    const { dir, options } = fixture();
    const result = runConsumerGate(options, { exec: failInstall, head });
    expect(result.code).toBe(1);
    expect([...new Set(result.summary?.steps.slice(1).map((step) => step.status))]).toEqual([
      "skipped",
    ]);
    expect(runConsumerGate({ ...options, product: "nope" }, { exec: failInstall, head }).code).toBe(
      2,
    );
    expect(runConsumerGate(options, { exec: failInstall, head: () => "dead000" }).error).toMatch(
      /pins abc1234/,
    );
    expect(
      runConsumerGate({ ...options, overlays: join(dir, "none") }, { exec: failInstall, head })
        .error,
    ).toMatch(/overlay manifest missing/);
    const dry = runConsumerGate({ ...options, dryRun: true }, { exec: failInstall, head });
    expect(dry.code).toBe(0);
    expect(dry.summary?.steps.every((step) => step.status === "skipped")).toBe(true);
  });

  it("refuses services pinned to different commits in one run", () => {
    const { options } = fixture();
    const matrix = loadConsumerGateMatrix(
      "products:\n  billing:\n    repo: a/b\n    pins: { billing: abc1234, entitlements: def5678 }\n    services: [billing, entitlements]\n",
    );
    const result = runConsumerGate({ ...options, matrix }, { exec: failInstall, head });
    expect(result.code).toBe(2);
    expect(result.error).toMatch(/different commits/);
    expect(
      runConsumerGate({ ...options, matrix, services: ["billing"] }, { exec: failInstall, head })
        .code,
    ).toBe(1);
  });
});

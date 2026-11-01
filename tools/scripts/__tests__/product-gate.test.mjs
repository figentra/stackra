/**
 * Stackra file contract:
 * Purpose: hold `product-gate.mjs` to its contract: the matrix and allow-list shapes, the core link rewrite, the step
 *          plan, the allow-list judgement and a whole run with a fake executor.
 * Boundary: temporary directories and a fake executor; no pnpm, no git, no network; node:test and node:assert.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-1813.
 */
// @covers sta-1813:FR-001 sta-1813:FR-002 sta-1813:FR-003 sta-1813:FR-004 sta-1813:FR-005 sta-1813:FR-006 sta-1813:FR-007
// @covers sta-1813:P-001 sta-1813:P-002 sta-1813:P-003 sta-1813:P-004 sta-1813:P-005 sta-1813:P-006
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  DEFAULT_ALLOW,
  DEFAULT_MATRIX,
  judge,
  linkWorkspace,
  loadAllow,
  loadMatrix,
  parseArgs,
  planSteps,
  runGate,
  signatures,
} from "../product-gate.mjs";

const TODAY = "2026-11-01";
const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
const entry = (over = {}) => ({
  product: "billing",
  step: "typecheck",
  match: "TS6133",
  issue: "STA-1",
  added: "2026-10-30",
  expires: "2026-11-10",
  ...over,
});
const allowOf = (...e) =>
  loadAllow(`allow:\n${e.map((x) => `  - ${JSON.stringify(x)}`).join("\n")}\n`, TODAY);

test("the committed matrix and allow-list load", () => {
  const products = loadMatrix(readFileSync(DEFAULT_MATRIX, "utf8"));
  assert.deepEqual(Object.keys(products), ["billing", "pay", "invoicing"]);
  assert.deepEqual(loadAllow(readFileSync(DEFAULT_ALLOW, "utf8"), TODAY), {
    entries: [],
    problems: [],
  });
});

test("a matrix without a ref, services or a known step is refused with the product's name", () => {
  assert.throws(
    () => loadMatrix("products:\n  x:\n    repo: a/b\n    services: [s]\n"),
    /x needs repo and ref/,
  );
  assert.throws(
    () => loadMatrix("products:\n  x:\n    repo: a/b\n    ref: abc1234\n"),
    /x needs a non-empty/,
  );
  assert.throws(
    () =>
      loadMatrix(
        "products:\n  x:\n    repo: a/b\n    ref: abc1234\n    services: [s]\n    steps: [nope]\n",
      ),
    /unknown step nope/,
  );
});

test("linkWorkspace rewrites core catalog rows and adds overrides, leaving the rest alone", () => {
  const links = {
    "@stackra/model": "link:/core/packages/data/model",
    "@stackra/gen": "link:/core/packages/developer/gen",
  };
  const text = 'catalog:\n  "@stackra/model": 0.3.0\n  zod: 4.1.0\n  "@stackra/other": 1.0.0\n';
  const out = linkWorkspace(text, links);
  assert.match(out, /^ {2}"@stackra\/model": "link:\/core\/packages\/data\/model"$/m);
  assert.match(out, /^ {2}zod: 4\.1\.0$/m);
  assert.match(out, /^ {2}"@stackra\/other": 1\.0\.0$/m);
  assert.match(out, /^overrides:\n {2}"@stackra\/model"/m);
  const again = linkWorkspace("overrides:\n  x: 1\n", links);
  assert.match(again, /^overrides:\n {2}"@stackra\/model": .*\n {2}"@stackra\/gen": .*\n {2}x: 1/m);
});

test("signatures keep failure lines only; judge excuses a step only when every one has a live entry", () => {
  const log = "ok\nfoo.ts(1,2): error TS6133 'A' is never read\nbar.ts(3,4): error TS2589 deep\n";
  assert.equal(signatures(log).length, 2);
  const live = allowOf(entry(), entry({ match: "TS2589", issue: "STA-2" })).entries;
  assert.deepEqual(judge(1, log, "billing", "typecheck", live), {
    status: "allowed",
    issues: ["STA-1", "STA-2"],
  });
  assert.equal(judge(0, "", "billing", "typecheck", live).status, "pass");
  assert.equal(judge(1, log, "billing", "typecheck", allowOf(entry()).entries).status, "fail");
  assert.equal(judge(1, log, "pay", "typecheck", live).status, "fail");
  assert.equal(judge(1, "killed\n", "billing", "typecheck", live).status, "fail");
  const byBase = allowOf(entry({ step: "test:int", match: "ERR_PNPM_X" })).entries;
  assert.equal(
    judge(1, "ERR_PNPM_X boom\n", "billing", "test:int/billing", byBase).status,
    "allowed",
  );
});

test("an expired entry excuses nothing and is named; a bad entry is a problem", () => {
  const { entries, problems } = allowOf(
    entry({ expires: "2026-10-31" }),
    entry({ issue: "ABC" }),
    entry({ expires: "2026-12-30" }),
    entry({ match: undefined }),
  );
  assert.equal(problems.length, 3);
  const log = "x.ts: error TS6133 'A'\n";
  assert.deepEqual(judge(1, log, "billing", "typecheck", entries), {
    status: "fail",
    uncovered: [log.trim()],
    expired: ["STA-1"],
  });
});

test("parseArgs needs the four paths and refuses unknown flags", () => {
  const base = ["--core", "c", "--checkout", "p", "--product", "billing", "--out", "o"];
  assert.equal(parseArgs(base).product, "billing");
  assert.ok(parseArgs([...base, "--dry-run"]).flags.has("dry-run"));
  assert.equal(parseArgs(base.slice(2)), null);
  assert.equal(parseArgs([...base, "--nope"]), null);
});

/** A core tree with one package, a product with two services (one with test:int) and an overlay manifest. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "product-gate-"));
  write(join(dir, "core/packages/data/model/package.json"), '{"name":"@stackra/model"}');
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
  const matrix = loadMatrix(
    "products:\n  billing:\n    repo: a/b\n    ref: abc1234\n    services: [billing, entitlements]\n    overlays: [tenancy]\n",
  );
  const opts = {
    core: join(dir, "core"),
    checkout: join(dir, "checkout"),
    product: "billing",
    out: join(dir, "out"),
    matrix,
    overlays: join(dir, "overlays"),
    today: TODAY,
    coreBuilt: true,
  };
  return { dir, opts };
}
const head = (d) => (d.endsWith("checkout") ? "abc1234ffff" : "core0000");

const failTypecheck = (argv, { logFile }) => {
  const failing = argv.includes("typecheck");
  writeFileSync(logFile, failing ? "a.ts(1,1): error TS6133 'A'\n" : "fine\n");
  return failing ? 1 : 0;
};

const failInstall = (argv, { logFile }) => {
  writeFileSync(logFile, "ERR_PNPM_X\n");
  return argv[1] === "install" ? 1 : 0;
};

test("planSteps is ordered and skips test:int and validate when the product lacks the script", () => {
  const { dir } = fixture();
  const ids = (steps) =>
    planSteps({ root: join(dir, "checkout"), services: ["billing", "entitlements"], steps }).map(
      ([id, , , skip]) => (skip ? `${id}!` : id),
    );
  assert.deepEqual(
    ids(["install", "build-deps", "gen", "typecheck", "test", "test:int", "validate"]),
    [
      "install",
      "build-deps",
      "gen/billing",
      "gen/entitlements",
      "typecheck",
      "test",
      "test:int/billing",
      "test:int/entitlements!",
      "validate",
    ],
  );
  assert.deepEqual(ids(["typecheck"]), ["typecheck"]);
});

test("a run overlays a scratch copy, writes both summaries and exits by the step results", () => {
  const { dir, opts } = fixture();
  const red = runGate(
    { ...opts, allow: allowOf(entry({ step: "gen" })) },
    { exec: failTypecheck, head },
  );
  assert.equal(red.code, 1);
  const work = join(opts.out, "work/billing");
  assert.ok(!existsSync(join(work, "pnpm-lock.yaml")) && !existsSync(join(work, "node_modules")));
  assert.match(
    readFileSync(join(work, "pnpm-workspace.yaml"), "utf8"),
    /"@stackra\/model": "link:.*packages\/data\/model"/,
  );
  assert.ok(existsSync(join(work, "services/tenancy/stackra.manifest.json")));
  assert.equal(readFileSync(join(dir, "checkout/pnpm-lock.yaml"), "utf8"), "lock\n");
  const json = JSON.parse(readFileSync(join(opts.out, "summary-billing.json"), "utf8"));
  assert.equal(json.checkout.sha, "abc1234ffff");
  assert.equal(json.core.sha, "core0000");
  assert.equal(json.steps.find((s) => s.id === "typecheck").status, "fail");
  assert.match(
    readFileSync(join(opts.out, "summary-billing.md"), "utf8"),
    /\| typecheck \| FAIL \|/,
  );
  assert.ok(existsSync(join(opts.out, "logs/billing/typecheck.log")));
  const green = runGate({ ...opts, allow: allowOf(entry()) }, { exec: failTypecheck, head });
  assert.equal(green.code, 0);
  assert.equal(green.summary.steps.find((s) => s.id === "typecheck").status, "allowed");
});

test("a failed install skips the rest; setup errors exit 2", () => {
  const { dir, opts: base } = fixture();
  const opts = { ...base, allow: allowOf() };
  const r = runGate(opts, { exec: failInstall, head });
  assert.equal(r.code, 1);
  assert.deepEqual([...new Set(r.summary.steps.slice(1).map((s) => s.status))], ["skipped"]);
  assert.equal(runGate({ ...opts, product: "nope" }, { exec: failInstall, head }).code, 2);
  assert.match(runGate(opts, { exec: failInstall, head: () => "dead000" }).error, /pins abc1234/);
  assert.match(
    runGate({ ...opts, overlays: join(dir, "none") }, { exec: failInstall, head }).error,
    /overlay manifest missing/,
  );
  const dry = runGate({ ...opts, dryRun: true }, { exec: failInstall, head });
  assert.equal(dry.code, 0);
  assert.ok(dry.summary.steps.every((s) => s.status === "skipped"));
});

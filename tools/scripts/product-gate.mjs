#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `product-gate` (STA-1813): given a core tree and a product checkout, generate, typecheck and test the
 *          product's services against that core and write `summary-<product>.json` and `.md`. It is the mechanised
 *          form of the hand-run gates (billing, pay and tax-move gates of 2026-11-01): copy the product, drop its
 *          lockfile, link every `@stackra/*` workspace package to the core tree, overlay the manifests of services the
 *          product does not hold, then install, build deps, `stackra gen --manifests && stackra gen`, typecheck, test,
 *          `test:int` and validate. A failing step is excused only by a live entry in the allow-list
 *          (`product-gate.allow.yaml`: an STA issue and an expiry per entry).
 * Boundary: reads the two trees and local git; writes only `--out` (the scratch copy, logs, summaries); never touches
 *           the product checkout or the core tree, never fetches (the caller clones), never reads or prints a secret
 *           (the caller's environment is passed through untouched; tokens come from Infisical on the box).
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed runs it); ADR 0166 (CI policy); spec `.agents/specs/sta-1813-product-gate`.
 * Secrets: none.
 *
 *   node tools/scripts/product-gate.mjs --core <dir> --checkout <dir> --product <name> --out <dir>
 *        [--matrix <file>] [--allow <file>] [--overlays <dir>] [--services a,b] [--steps a,b]
 *        [--core-prebuilt] [--today YYYY-MM-DD] [--dry-run]
 *
 * Exit: 0 every step passed or is excused; 1 a blocking failure (or an invalid allow entry); 2 usage or setup error
 * (unknown product, checkout not at the pinned ref, missing overlay manifest).
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MATRIX = join(HERE, "product-gate.matrix.yaml");
export const DEFAULT_ALLOW = join(HERE, "product-gate.allow.yaml");
export const DEFAULT_STEPS = [
  "install",
  "build-deps",
  "gen",
  "typecheck",
  "test",
  "test:int",
  "validate",
];
export const MAX_ALLOW_DAYS = 30;
// The flags the hand-run gates installed a product with: a linked core has no registry provenance.
const INSTALL = [
  "install",
  "--no-frozen-lockfile",
  "--config.trust-policy=off",
  "--config.strict-dep-builds=false",
];
const GEN = "pnpm exec stackra gen --manifests && pnpm exec stackra gen";
const DAY = 86_400_000;

/** `@stackra/*` packages under `<core>/packages/<category>/<name>`, as `{ name: "link:<abs path>" }`. */
export function coreLinks(core) {
  const links = {};
  const walk = (dir, depth) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "node_modules" || entry.name.startsWith("."))
        continue;
      const path = join(dir, entry.name);
      const manifest = join(path, "package.json");
      if (existsSync(manifest)) {
        const name = JSON.parse(readFileSync(manifest, "utf8")).name;
        if (name?.startsWith("@stackra/")) links[name] = `link:${path}`;
      } else if (depth < 2) walk(path, depth + 1);
    }
  };
  walk(join(core, "packages"), 0);
  return links;
}

/** pnpm-workspace.yaml with each catalog `@stackra/*` entry and an `overrides:` row pointing at the core link. */
export function linkWorkspace(text, links) {
  const catalog = text.replaceAll(/^(\s+)"?(@stackra\/[^":]+)"?: .*$/gm, (row, space, name) =>
    links[name] ? `${space}"${name}": "${links[name]}"` : row,
  );
  const rows = `${Object.entries(links)
    .map(([name, link]) => `  "${name}": "${link}"`)
    .join("\n")}\n`;
  return /^overrides:\n/m.test(catalog)
    ? catalog.replace(/^overrides:\n/m, `overrides:\n${rows}`)
    : `${catalog}\noverrides:\n${rows}`;
}

/** The matrix, validated: `products.<name>` has repo, a ref, services, optional overlays and steps. */
export function loadMatrix(text) {
  const products = parse(text)?.products;
  if (!products || typeof products !== "object") throw new Error("matrix: `products` is missing");
  for (const [name, p] of Object.entries(products)) {
    if (typeof p.repo !== "string" || typeof p.ref !== "string")
      throw new Error(`matrix: ${name} needs repo and ref`);
    if (!Array.isArray(p.services) || !p.services.length)
      throw new Error(`matrix: ${name} needs a non-empty services list`);
    for (const step of p.steps ?? [])
      if (!DEFAULT_STEPS.includes(step))
        throw new Error(`matrix: ${name} names unknown step ${step}`);
  }
  return products;
}

/** The allow-list: `entries` that are well formed (each marked `expired` or not), and `problems` for the rest. */
export function loadAllow(text, today) {
  const raw = parse(text)?.allow ?? [];
  const entries = [];
  const problems = [];
  raw.forEach((e, i) => {
    const at = `allow[${i}]`;
    const days = (Date.parse(e.expires) - Date.parse(e.added)) / DAY;
    if (!e.product || !e.step || !e.match)
      problems.push(`${at}: product, step and match are required`);
    else if (!/^STA-\d+$/.test(e.issue ?? "")) problems.push(`${at}: issue must be an STA-n key`);
    else if (!(days > 0 && days <= MAX_ALLOW_DAYS))
      problems.push(`${at}: expires must be 1 to ${MAX_ALLOW_DAYS} days after added`);
    else entries.push({ ...e, expired: String(e.expires) < today });
  });
  return { entries, problems };
}

/** The log lines that name a failure: the unit an allow entry's `match` is compared with. */
export function signatures(log) {
  const found = log
    .split("\n")
    .filter((l) => /error TS\d+|^\s*(FAIL|×)\s|\bERR_PNPM_\w+|\bError:/.test(l))
    .map((l) => l.trim().slice(0, 300));
  return [...new Set(found)];
}

/** pass, allowed (every failure line has a live entry) or fail; `expired` names entries that would have excused it. */
export function judge(code, log, product, id, allow) {
  if (code === 0) return { status: "pass" };
  const mine = allow.filter(
    (e) => e.product === product && (e.step === id || e.step === id.split("/")[0]),
  );
  const entryFor = (sig, expired) =>
    mine.find((e) => e.expired === expired && sig.includes(e.match));
  const sigs = signatures(log);
  const uncovered = sigs.filter((s) => !entryFor(s, false));
  if (sigs.length && !uncovered.length)
    return { status: "allowed", issues: [...new Set(sigs.map((s) => entryFor(s, false).issue))] };
  return {
    status: "fail",
    uncovered: uncovered.length ? uncovered : ["(no recognised failure line)"],
    expired: [...new Set(sigs.map((s) => entryFor(s, true)?.issue).filter(Boolean))],
  };
}

/** The step plan, `[id, argv, cwd, skipReason?]`, read from the scratch tree (service names, scripts). */
export function planSteps({ root, services, steps }) {
  const pkg = (dir) => JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
  const names = services.map((s) => pkg(`services/${s}`).name);
  const own = names.map((n) => `--filter=${n}`);
  const turbo = (task) => [
    "pnpm",
    "exec",
    "turbo",
    "run",
    task,
    "--continue",
    "--concurrency=1",
    ...own,
  ];
  const plan = [];
  const add = (id, argv, cwd = ".", skip) =>
    steps.includes(id.split("/")[0]) && plan.push([id, argv, cwd, skip]);
  add("install", ["pnpm", ...INSTALL]);
  add("build-deps", [
    "pnpm",
    "exec",
    "turbo",
    "run",
    "build",
    ...names.map((n) => `--filter=${n}^...`),
  ]);
  for (const s of services) add(`gen/${s}`, ["sh", "-c", GEN], `services/${s}`);
  add("typecheck", turbo("typecheck"));
  add("test", turbo("test"));
  for (const s of services) {
    const has = Boolean(pkg(`services/${s}`).scripts?.["test:int"]);
    add(
      `test:int/${s}`,
      ["pnpm", "run", "test:int"],
      `services/${s}`,
      has ? undefined : "no test:int script",
    );
  }
  const has = Boolean(pkg(".").scripts?.validate);
  add("validate", ["pnpm", "run", "validate"], ".", has ? undefined : "no validate script");
  return plan;
}

const LABEL = { pass: "PASS", allowed: "ALLOWED", fail: "FAIL", skipped: "SKIPPED" };

const detail = (r) =>
  r.status === "allowed"
    ? r.issues.join(", ")
    : r.status === "fail"
      ? [
          ...r.uncovered.slice(0, 3),
          ...(r.expired.length ? [`expired: ${r.expired.join(", ")}`] : []),
        ].join("; ")
      : (r.reason ?? "");

export function renderMarkdown(s) {
  const lines = [
    `# Product gate: ${s.product} (${s.verdict})`,
    "",
    `Core \`${s.core.sha ?? "unknown"}\`, product \`${s.checkout.sha ?? "unknown"}\` (pinned \`${s.ref}\`), ${s.date}.`,
    "",
    "| Step | Result | Detail |",
    "| --- | --- | --- |",
    ...s.steps.map((r) => `| ${r.id} | ${LABEL[r.status]} | ${detail(r).replaceAll("|", "\\|")} |`),
    ...s.problems.flatMap((p) => ["", `Allow-list problem: ${p}`]),
  ];
  return `${lines.join("\n")}\n`;
}

const defaultExec = (argv, { cwd, logFile }) => {
  const fd = openSync(logFile, "w");
  const run = spawnSync(argv[0], argv.slice(1), {
    cwd,
    stdio: ["ignore", fd, fd],
    env: { ...process.env, CI: "1", TURBO_TELEMETRY_DISABLED: "1" },
  });
  return run.status ?? 1;
};
const gitHead = (dir) => {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
};

/** Runs the gate. `exec(argv, { cwd, logFile }) => exit code` and `head(dir) => sha` are seams for the test. */
export function runGate(opts, { exec = defaultExec, head = gitHead } = {}) {
  const { core, checkout, product, out, matrix, allow, overlays, today } = opts;
  const spec = matrix[product];
  if (!spec) return { code: 2, error: `unknown product ${product}` };
  const sha = head(checkout);
  if (/^[0-9a-f]{7,40}$/.test(spec.ref) && !sha?.startsWith(spec.ref))
    return { code: 2, error: `checkout is at ${sha}, the matrix pins ${spec.ref}` };
  const root = join(out, "work", product);
  mkdirSync(join(out, "logs", product), { recursive: true });
  rmSync(root, { recursive: true, force: true });
  cpSync(checkout, root, {
    recursive: true,
    filter: (p) =>
      !/(^|\/)(node_modules|\.git|\.stackra|\.turbo)(\/|$)/.test(relative(checkout, p)),
  });
  // The checkout's lockfile is never touched: the copy loses it and installs from the registry, core linked.
  rmSync(join(root, "pnpm-lock.yaml"), { force: true });
  const workspace = join(root, "pnpm-workspace.yaml");
  writeFileSync(workspace, linkWorkspace(readFileSync(workspace, "utf8"), coreLinks(core)));
  for (const svc of spec.overlays ?? []) {
    if (existsSync(join(root, "services", svc, "package.json"))) continue;
    const from = join(overlays ?? "", svc, "stackra.manifest.json");
    if (!existsSync(from)) return { code: 2, error: `overlay manifest missing: ${from}` };
    mkdirSync(join(root, "services", svc), { recursive: true });
    cpSync(from, join(root, "services", svc, "stackra.manifest.json"));
  }

  const plan = planSteps({
    root,
    services: opts.services ?? spec.services,
    steps: opts.steps ?? spec.steps ?? DEFAULT_STEPS,
  });
  const results = [];
  const logOf = (id) => join(out, "logs", product, `${id.replaceAll("/", "-")}.log`);
  const run = (id, argv, cwd) => {
    if (opts.dryRun)
      return results.push({ id, status: "skipped", reason: `dry run: ${argv.join(" ")}` });
    const code = exec(argv, { cwd: join(root, cwd), logFile: logOf(id) });
    const log = code === 0 ? "" : readFileSync(logOf(id), "utf8");
    results.push({ id, code, ...judge(code, log, product, id, allow.entries) });
  };
  if (!opts.dryRun) {
    // turbo hashes through git, so the scratch copy is a one-commit repository, as in the hand-run gates.
    const commit = ["-c", "user.email=g@l", "-c", "user.name=g", "-c", "core.hooksPath=/dev/null"];
    for (const argv of [
      ["git", "init", "-q"],
      ["git", "add", "-A"],
      ["git", ...commit, "commit", "-qm", "gate"],
    ])
      exec(argv, { cwd: root, logFile: logOf("git-init") });
    if (!opts.coreBuilt) {
      const filters = ["--filter=!@figentra/mobile", "--filter=!@figentra/playground"];
      run(
        "core-install",
        ["pnpm", "install", "--frozen-lockfile", ...filters],
        relative(root, core),
      );
      run(
        "core-build",
        ["pnpm", "exec", "turbo", "run", "build", "--filter=./packages/**"],
        relative(root, core),
      );
    }
  }
  let stopped = results.some((r) => r.status === "fail");
  for (const [id, argv, cwd, skip] of plan) {
    if (skip || stopped) {
      results.push({
        id,
        status: "skipped",
        reason: skip ?? "an earlier install or core build failed",
      });
      continue;
    }
    run(id, argv, cwd);
    stopped ||= id === "install" && results.at(-1).status === "fail";
  }
  const verdict =
    results.some((r) => r.status === "fail") || allow.problems.length ? "RED" : "GREEN";
  const summary = {
    product,
    verdict,
    date: today,
    ref: spec.ref,
    core: { dir: core, sha: head(core) },
    checkout: { sha },
    steps: results,
    problems: allow.problems,
  };
  writeFileSync(join(out, `summary-${product}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(out, `summary-${product}.md`), renderMarkdown(summary));
  return { code: verdict === "GREEN" ? 0 : 1, summary };
}

const VALUED = new Set([
  "core",
  "checkout",
  "product",
  "out",
  "matrix",
  "allow",
  "overlays",
  "services",
  "steps",
  "today",
]);

/** Argument parsing: the options object, or null for a bad shape. */
export function parseArgs(argv) {
  const o = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, "");
    if (!argv[i].startsWith("--")) return null;
    if (VALUED.has(name)) o[name] = argv[++i];
    else if (name === "core-prebuilt" || name === "dry-run") o.flags.add(name);
    else return null;
  }
  return o.core && o.checkout && o.product && o.out ? o : null;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a) {
    console.error(
      "usage: product-gate --core <dir> --checkout <dir> --product <name> --out <dir> [options]",
    );
    process.exit(2);
  }
  const today = a.today ?? new Date().toISOString().slice(0, 10);
  const result = runGate({
    core: resolve(a.core),
    checkout: resolve(a.checkout),
    product: a.product,
    out: resolve(a.out),
    matrix: loadMatrix(readFileSync(a.matrix ?? DEFAULT_MATRIX, "utf8")),
    allow: loadAllow(readFileSync(a.allow ?? DEFAULT_ALLOW, "utf8"), today),
    overlays: a.overlays && resolve(a.overlays),
    services: a.services?.split(","),
    steps: a.steps?.split(","),
    coreBuilt: a.flags.has("core-prebuilt"),
    dryRun: a.flags.has("dry-run"),
    today,
  });
  if (result.error) console.error(`product-gate: ${result.error}`);
  else console.log(renderMarkdown(result.summary));
  process.exit(result.code);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();

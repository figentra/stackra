/**
 * Stackra file contract:
 * Purpose: `executeConsumerGate(options, deps)`, the gate for one product, after `validateConsumerGateSetup`: copy the
 *          checkout into `<out>/work/<key>` without `node_modules`, `.git`, `.stackra` and `.turbo`, drop its
 *          lockfile, point every core `@stackra/*` package at core (`link:` rows in `link` mode; in `pack` mode
 *          `file:` rows to tarballs of every publishable package, packed into `<out>/tarballs`), overlay the manifests
 *          of services the product does not hold, make the copy a one-commit repository (turbo hashes through git),
 *          then run the planned steps: install, leak (pack only), build-deps (then a commit), gen (then a drift
 *          record), typecheck, lint, build, test, test:int, and the repo-own format, spell and validate in the repo-own
 *          window. A failed install, core pack or leak skips the rest; another failure lets later steps run. Writes
 *          `summary-<key>.json`, `summary-<key>.md`, `gen-drift-<key>.txt` and one log per step under `<out>`.
 * Boundary: writes only under `options.out`; never touches the checkout or the core tree (core must be built already),
 *           never fetches, never reads a secret. Processes run through `deps.exec`. Throws on a setup error.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; ADR 0166; spec `.agents/specs/sta-1813-product-gate`.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { CONSUMER_GATE_REPO_OWN_STEPS } from "#node/consumer-gate/constants/consumer-gate-repo-own-steps.constant";
import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import { buildConsumerGateEnvironment } from "#node/consumer-gate/functions/build-consumer-gate-environment.function";
import { checkConsumerGateAllowRefs } from "#node/consumer-gate/functions/check-consumer-gate-allow-refs.function";
import { coreTarballLinks } from "#node/consumer-gate/functions/core-tarball-links.function";
import { hashConsumerGateFile } from "#node/consumer-gate/functions/hash-consumer-gate-file.function";
import { inspectConsumerGateLeaks } from "#node/consumer-gate/functions/inspect-consumer-gate-leaks.function";
import { judgeConsumerGateStep } from "#node/consumer-gate/functions/judge-consumer-gate-step.function";
import { linkConsumerWorkspace } from "#node/consumer-gate/functions/link-consumer-workspace.function";
import { listCoreLinks } from "#node/consumer-gate/functions/list-core-links.function";
import { listCorePacks } from "#node/consumer-gate/functions/list-core-packs.function";
import { planConsumerGateSteps } from "#node/consumer-gate/functions/plan-consumer-gate-steps.function";
import { renderConsumerGateSummary } from "#node/consumer-gate/functions/render-consumer-gate-summary.function";
import { validateConsumerGateSetup } from "#node/consumer-gate/functions/validate-consumer-gate-setup.function";
import { withConsumerGateRepoOwn } from "#node/consumer-gate/functions/with-consumer-gate-repo-own.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";
import type { ConsumerGateOptions } from "#node/consumer-gate/types/consumer-gate-options.type";
import type { ConsumerGateRun } from "#node/consumer-gate/types/consumer-gate-run.type";
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";
import type { ConsumerGateSummary } from "#node/consumer-gate/types/consumer-gate-summary.type";

/** Git settings for the scratch repository: no signing, no hooks, a fixed identity. */
const GIT_CONFIG = [
  "-c",
  "commit.gpgsign=false",
  "-c",
  "user.name=consumer-gate",
  "-c",
  "user.email=consumer-gate@localhost",
  "-c",
  "core.hooksPath=/dev/null",
];

/**
 * Runs the gate.
 *
 * @param options - the resolved paths, matrix, allow-list and flags.
 * @param deps - the process runner and `git rev-parse HEAD`.
 * @example
 * const { code } = executeConsumerGate(options, createConsumerGateDeps());
 */
export function executeConsumerGate(
  options: ConsumerGateOptions,
  deps: ConsumerGateDeps,
): ConsumerGateRun {
  const { core, checkout, product, out, allow, overlays } = options;
  const { spec, services, ref, sha, key, mode } = validateConsumerGateSetup(options, deps);
  if (allow.refused.length > 0) {
    throw new Error(`the allow-list is refused: ${allow.refused.join("; ")}`);
  }
  const problems = [
    ...allow.problems,
    ...checkConsumerGateAllowRefs(allow.entries, Object.keys(options.matrix)),
  ];
  const root = join(out, "work", key);
  mkdirSync(join(out, "logs", key), { recursive: true });
  rmSync(root, { recursive: true, force: true });
  cpSync(checkout, root, {
    recursive: true,
    filter: (path) =>
      !/(^|\/)(node_modules|\.git|\.stackra|\.turbo)(\/|$)/.test(relative(checkout, path)),
  });
  // The checkout's lockfile is never touched: the copy loses it and installs from the registry, core linked or packed.
  const lockfileBefore = hashConsumerGateFile(join(checkout, "pnpm-lock.yaml"));
  rmSync(join(root, "pnpm-lock.yaml"), { force: true });
  const tarballs = join(out, "tarballs");
  const packs = mode === "pack" ? listCorePacks(core) : [];
  const workspace = join(root, "pnpm-workspace.yaml");
  writeFileSync(
    workspace,
    linkConsumerWorkspace(
      readFileSync(workspace, "utf8"),
      mode === "pack" ? coreTarballLinks(packs, tarballs) : listCoreLinks(core),
    ),
  );
  const overlayHashes: Record<string, string> = {};
  const overlayOnly: string[] = [];
  for (const service of spec.overlays ?? []) {
    if (existsSync(join(root, "services", service, "package.json"))) continue;
    const from = join(overlays as string, service, "stackra.manifest.json");
    if (!existsSync(from)) throw new Error(`overlay manifest missing: ${from}`);
    mkdirSync(join(root, "services", service), { recursive: true });
    cpSync(from, join(root, "services", service, "stackra.manifest.json"));
    overlayHashes[service] = hashConsumerGateFile(from) as string;
    if (!existsSync(join(checkout, "services", service))) overlayOnly.push(service);
  }

  const plan = planConsumerGateSteps({
    root,
    services,
    steps: options.steps ?? spec.steps ?? CONSUMER_GATE_STEPS,
    mode,
  });
  if (plan.length === 0) throw new Error("no step to run: --steps names none of the planned steps");
  const results: ConsumerGateStepResult[] = [];
  const logOf = (id: string): string =>
    join(out, "logs", key, `${id.replaceAll("/", "-").replaceAll("@", "")}.log`);
  const run = (id: string, argv: readonly string[], cwd: string): void => {
    if (options.dryRun) {
      results.push({ id, status: "skipped", reason: `dry run: ${argv.join(" ")}` });
      return;
    }
    const code = deps.exec(argv, { cwd: join(root, cwd), logFile: logOf(id) });
    const log = code === 0 ? "" : readFileSync(logOf(id), "utf8");
    results.push({ id, code, ...judgeConsumerGateStep(code, log, product, id, allow.entries) });
  };
  const git = (name: string, args: readonly string[]): void => {
    const code = deps.exec(["git", ...GIT_CONFIG, ...args], { cwd: root, logFile: logOf(name) });
    if (code !== 0) throw new Error(`git ${args[0]} failed in the scratch copy: ${logOf(name)}`);
  };
  let pnpmOutput: string | undefined;
  if (!options.dryRun) {
    // turbo hashes through git, so the scratch copy is a one-commit repository.
    git("git-init", ["init", "-q"]);
    git("git-add", ["add", "-A"]);
    git("git-commit", ["commit", "-qm", "consumer-gate"]);
    if (deps.exec(["pnpm", "--version"], { cwd: root, logFile: logOf("pnpm-version") }) === 0) {
      pnpmOutput = readFileSync(logOf("pnpm-version"), "utf8");
    }
    if (mode === "pack") {
      // Tarballs go under --out; a package is packed from its own folder, which `pnpm pack` does not write.
      mkdirSync(tarballs, { recursive: true });
      const failed = packs.filter(
        (pack) =>
          deps.exec(["pnpm", "pack", "--pack-destination", tarballs], {
            cwd: pack.dir,
            logFile: logOf(`core-pack-${pack.name.replace("/", "-")}`),
          }) !== 0,
      );
      results.push(
        failed.length === 0
          ? { id: "core-pack", status: "pass" }
          : {
              id: "core-pack",
              status: "fail",
              uncovered: failed.map((pack) => `ERR_PNPM_PACK ${pack.name}`),
            },
      );
    }
  }
  let genDrift: ConsumerGateSummary["genDrift"];
  let stopped = results.some((result) => result.status === "fail");
  for (const [index, { id, argv, cwd, skip }] of plan.entries()) {
    if (skip !== undefined || stopped) {
      results.push({
        id,
        status: "skipped",
        reason: skip ?? "an earlier install, core pack or leak check failed",
      });
      continue;
    }
    if (id === "leak") {
      // Never judged by the allow-list: a leak is a core-side finding.
      const findings = options.dryRun ? [] : inspectConsumerGateLeaks(root, core);
      results.push(
        options.dryRun
          ? { id, status: "skipped", reason: "dry run: leak check" }
          : findings.length === 0
            ? { id, status: "pass" }
            : { id, status: "fail", uncovered: findings },
      );
    } else if (CONSUMER_GATE_REPO_OWN_STEPS.includes(id)) {
      withConsumerGateRepoOwn({ root, checkout, aside: join(out, "aside", key), overlayOnly }, () =>
        run(id, argv, cwd),
      );
    } else {
      run(id, argv, cwd);
    }
    stopped ||= (id === "install" || id === "leak") && results.at(-1)?.status === "fail";
    if (options.dryRun) continue;
    if (id === "build-deps") {
      git("git-build-add", ["add", "-A"]);
      git("git-build-commit", ["commit", "-qm", "build-deps", "--allow-empty"]);
    }
    if (id.startsWith("gen/") && !plan[index + 1]?.id.startsWith("gen/")) {
      const file = join(out, `gen-drift-${key}.txt`);
      deps.exec(["git", "status", "--porcelain"], { cwd: root, logFile: file });
      genDrift = {
        file,
        changes: readFileSync(file, "utf8")
          .split("\n")
          .filter((line) => line !== "").length,
      };
    }
  }
  const verdict =
    results.some((result) => result.status === "fail") || problems.length > 0 ? "RED" : "GREEN";
  const genPackage = join(core, "packages", "developer", "gen", "package.json");
  const summary: ConsumerGateSummary = {
    product,
    key,
    mode,
    verdict,
    date: options.today,
    ref,
    core: { dir: core, sha: deps.head(core) },
    checkout: { sha },
    steps: results,
    problems,
    environment: buildConsumerGateEnvironment({
      coreCommit: deps.head(core),
      productRef: ref,
      mode,
      node: process.version,
      pnpmOutput,
      lockfileBefore,
      lockfileAfter: hashConsumerGateFile(join(root, "pnpm-lock.yaml")),
      gen: existsSync(genPackage)
        ? (JSON.parse(readFileSync(genPackage, "utf8")) as { version?: string }).version
        : undefined,
      overlays: overlayHashes,
      reproduce: options.reproduce ?? "",
    }),
    ...(genDrift === undefined ? {} : { genDrift }),
  };
  writeFileSync(join(out, `summary-${key}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(out, `summary-${key}.md`), renderConsumerGateSummary(summary));
  return { code: verdict === "GREEN" ? 0 : 1, summary };
}

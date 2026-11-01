/**
 * Stackra file contract:
 * Purpose: `runConsumerGate(options, deps)`, the gate for one product: copy the checkout into `<out>/work/<product>`
 *          without `node_modules`, `.git`, `.stackra` and `.turbo`, drop its lockfile, link every core `@stackra/*`
 *          package, overlay the manifests of services the product does not hold, make the copy a one-commit
 *          repository (turbo hashes through git), install and build core unless it is prebuilt, then run the planned
 *          steps and write `summary-<product>.json`, `summary-<product>.md` and one log per step under `<out>`.
 *          A failed install or core build skips the rest; another failure lets later steps run. Resolves with exit
 *          code 0 (every step passed or is excused), 1 (a blocking failure or a malformed allow entry) or 2 (setup
 *          error: unknown product, checkout not at the pin, missing overlay manifest).
 * Boundary: writes only under `options.out`; never touches the checkout or the core tree, never fetches, never reads
 *           a secret. Processes run through `deps.exec`.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; ADR 0166; spec `.agents/specs/sta-1813-product-gate`.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import { judgeConsumerGateStep } from "#node/consumer-gate/functions/judge-consumer-gate-step.function";
import { linkConsumerWorkspace } from "#node/consumer-gate/functions/link-consumer-workspace.function";
import { listCoreLinks } from "#node/consumer-gate/functions/list-core-links.function";
import { planConsumerGateSteps } from "#node/consumer-gate/functions/plan-consumer-gate-steps.function";
import { renderConsumerGateSummary } from "#node/consumer-gate/functions/render-consumer-gate-summary.function";
import { resolveConsumerGateRef } from "#node/consumer-gate/functions/resolve-consumer-gate-ref.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";
import type { ConsumerGateOptions } from "#node/consumer-gate/types/consumer-gate-options.type";
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";
import type { ConsumerGateSummary } from "#node/consumer-gate/types/consumer-gate-summary.type";

/**
 * Runs the gate.
 *
 * @param options - the resolved paths, matrix, allow-list and flags.
 * @param deps - the process runner and `git rev-parse HEAD`.
 * @example
 * const { code } = runConsumerGate(options, createConsumerGateDeps());
 */
export function runConsumerGate(
  options: ConsumerGateOptions,
  deps: ConsumerGateDeps,
): { readonly code: number; readonly error?: string; readonly summary?: ConsumerGateSummary } {
  const { core, checkout, product, out, allow, overlays } = options;
  const spec = options.matrix[product];
  if (!spec) return { code: 2, error: `unknown product ${product}` };
  const services = options.services ?? spec.services;
  const pin = resolveConsumerGateRef(spec, services);
  if ("error" in pin) return { code: 2, error: pin.error };
  const sha = deps.head(checkout);
  if (/^[0-9a-f]{7,40}$/.test(pin.ref) && !sha?.startsWith(pin.ref)) {
    return { code: 2, error: `checkout is at ${sha}, the matrix pins ${pin.ref}` };
  }
  const root = join(out, "work", product);
  mkdirSync(join(out, "logs", product), { recursive: true });
  rmSync(root, { recursive: true, force: true });
  cpSync(checkout, root, {
    recursive: true,
    filter: (path) =>
      !/(^|\/)(node_modules|\.git|\.stackra|\.turbo)(\/|$)/.test(relative(checkout, path)),
  });
  // The checkout's lockfile is never touched: the copy loses it and installs from the registry, core linked.
  rmSync(join(root, "pnpm-lock.yaml"), { force: true });
  const workspace = join(root, "pnpm-workspace.yaml");
  writeFileSync(
    workspace,
    linkConsumerWorkspace(readFileSync(workspace, "utf8"), listCoreLinks(core)),
  );
  for (const service of spec.overlays ?? []) {
    if (existsSync(join(root, "services", service, "package.json"))) continue;
    const from = join(overlays ?? "", service, "stackra.manifest.json");
    if (!existsSync(from)) return { code: 2, error: `overlay manifest missing: ${from}` };
    mkdirSync(join(root, "services", service), { recursive: true });
    cpSync(from, join(root, "services", service, "stackra.manifest.json"));
  }

  const plan = planConsumerGateSteps({
    root,
    services,
    steps: options.steps ?? spec.steps ?? CONSUMER_GATE_STEPS,
  });
  const results: ConsumerGateStepResult[] = [];
  const logOf = (id: string): string =>
    join(out, "logs", product, `${id.replaceAll("/", "-")}.log`);
  const run = (id: string, argv: readonly string[], cwd: string): void => {
    if (options.dryRun) {
      results.push({ id, status: "skipped", reason: `dry run: ${argv.join(" ")}` });
      return;
    }
    const code = deps.exec(argv, { cwd: join(root, cwd), logFile: logOf(id) });
    const log = code === 0 ? "" : readFileSync(logOf(id), "utf8");
    results.push({ id, code, ...judgeConsumerGateStep(code, log, product, id, allow.entries) });
  };
  if (!options.dryRun) {
    // turbo hashes through git, so the scratch copy is a one-commit repository.
    const commit = ["-c", "user.email=g@l", "-c", "user.name=g", "-c", "core.hooksPath=/dev/null"];
    for (const argv of [
      ["git", "init", "-q"],
      ["git", "add", "-A"],
      ["git", ...commit, "commit", "-qm", "gate"],
    ]) {
      deps.exec(argv, { cwd: root, logFile: logOf("git-init") });
    }
    if (!options.coreBuilt) {
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
  let stopped = results.some((result) => result.status === "fail");
  for (const { id, argv, cwd, skip } of plan) {
    if (skip !== undefined || stopped) {
      results.push({
        id,
        status: "skipped",
        reason: skip ?? "an earlier install or core build failed",
      });
      continue;
    }
    run(id, argv, cwd);
    stopped ||= id === "install" && results.at(-1)?.status === "fail";
  }
  const verdict =
    results.some((result) => result.status === "fail") || allow.problems.length > 0
      ? "RED"
      : "GREEN";
  const summary: ConsumerGateSummary = {
    product,
    verdict,
    date: options.today,
    ref: pin.ref,
    core: { dir: core, sha: deps.head(core) },
    checkout: { sha },
    steps: results,
    problems: allow.problems,
  };
  writeFileSync(join(out, `summary-${product}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(out, `summary-${product}.md`), renderConsumerGateSummary(summary));
  return { code: verdict === "GREEN" ? 0 : 1, summary };
}

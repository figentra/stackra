/**
 * Stackra file contract:
 * Purpose: `scaffoldConsumerApp(input, deps)`, the `scaffold` consumer made the way a user makes an app, with the core
 *          tree's own built CLI: `stackra create <root> --starter <checkout> --tarballs <tarballs>` (files only: no
 *          doctor, install or git; the `@stackra/*` packages resolve to the packed tarballs through `overrides:`), then
 *          `stackra new service <service> --area app --data` in it, then the matrix `fixture` folder copied into that
 *          service. Resolves with one step result each for `scaffold/create` and `scaffold/service`; a failed create
 *          skips the service. A dry run plans both and runs neither.
 * Boundary: writes only `root` (under `--out`); reads the starter checkout, the tarball folder and the fixture; runs
 *           the CLI through `deps.exec` with node, never through a shell. A scaffold failure is core's own (its create
 *           or new is broken), so it is never judged by the allow-list.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0515 (decision 3: `create --starter`, `--tarballs`); STA-1813
 *                     (FR-013); STA-2705.
 */
import { cpSync, existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { CONSUMER_GATE_SCAFFOLD } from "#node/consumer-gate/constants/consumer-gate-scaffold.constant";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";

/** A line of a failed CLI run worth showing: an error box line, a pnpm or Node error code, or a FAIL task. */
const ERROR_LINE = /error|ERR_|FAIL|refus|not found|cannot/i;

/** The lines of a failed step's log that say why, at most three; else its last line. */
function failureLines(logFile: string): string[] {
  const lines = existsSync(logFile)
    ? readFileSync(logFile, "utf8")
        .split("\n")
        .map((line) => line.replaceAll(/[│╭╮╰╯─]/g, "").trim())
        .filter((line) => line !== "")
    : [];
  const errors = lines.filter((line) => ERROR_LINE.test(line)).slice(0, 3);
  return errors.length > 0 ? errors : lines.slice(-1);
}

/**
 * Makes the scaffold app.
 *
 * @param input - the core tree, the starter checkout, the app folder to create, the tarball folder, the matrix
 *        entry, where each step logs, and whether to run nothing.
 * @param deps - the process runner.
 * @example
 * scaffoldConsumerApp({ core, starter, root, tarballs, spec, logOf }, deps); // [{ id: "scaffold/create", ... }, ...]
 */
export function scaffoldConsumerApp(
  input: {
    readonly core: string;
    readonly starter: string;
    readonly root: string;
    readonly tarballs: string;
    readonly spec: ConsumerGateProduct;
    readonly logOf: (id: string) => string;
    readonly dryRun?: boolean;
  },
  deps: ConsumerGateDeps,
): ConsumerGateStepResult[] {
  const { core, starter, root, tarballs, spec, logOf } = input;
  const cli = [process.execPath, join(core, CONSUMER_GATE_SCAFFOLD.cli)];
  const service = spec.service as string;
  const steps: { id: string; argv: string[]; cwd: string }[] = [
    {
      id: "scaffold/create",
      argv: [
        ...cli,
        "create",
        root,
        "--yes",
        "--no-interaction",
        "--no-doctor",
        "--no-install",
        "--no-git",
        "--starter",
        starter,
        "--tarballs",
        tarballs,
        "--name",
        CONSUMER_GATE_SCAFFOLD.name,
        "--scope",
        CONSUMER_GATE_SCAFFOLD.scope,
        "--profile",
        spec.profile ?? CONSUMER_GATE_SCAFFOLD.profile,
      ],
      cwd: dirname(root),
    },
    {
      id: "scaffold/service",
      argv: [
        ...cli,
        "new",
        "service",
        service,
        "--area",
        CONSUMER_GATE_SCAFFOLD.area,
        "--data",
        "--summary",
        CONSUMER_GATE_SCAFFOLD.summary,
      ],
      cwd: root,
    },
  ];
  const results: ConsumerGateStepResult[] = [];
  for (const { id, argv, cwd } of steps) {
    if (input.dryRun) {
      results.push({
        id,
        status: "skipped",
        reason: `dry run: stackra ${argv.slice(2).join(" ")}`,
      });
      continue;
    }
    if (results.some((result) => result.status === "fail")) {
      results.push({ id, status: "skipped", reason: "the app could not be created" });
      continue;
    }
    const code = deps.exec(argv, { cwd, logFile: logOf(id) });
    results.push(
      code === 0
        ? { id, code, status: "pass" }
        : { id, code, status: "fail", uncovered: failureLines(logOf(id)) },
    );
  }
  if (results.at(-1)?.status === "pass") {
    cpSync(resolve(core, spec.fixture as string), join(root, "services", service), {
      recursive: true,
    });
  }
  return results;
}

/**
 * Stackra file contract:
 * Purpose: `ConsumerGateCommand`, `stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir>
 *          [--mode link|pack] [--matrix <file>] [--allow <file>] [--overlays <dir>] [--services a,b] [--steps a,b]
 *          [--today YYYY-MM-DD] [--dry-run]`: given a core tree and a consumer product checkout, generate, typecheck and
 *          test the product's services against that core and write `summary-<product>.json` and `.md` (was
 *          `tools/scripts/product-gate.mjs`, STA-1813). The matrix and the allow-list are the repository's own data, by
 *          default `tools/consumer-gate/matrix.yaml` and `allow.yaml` under the working directory. Prints the Markdown
 *          summary (the summary is the `--json` data). Exit 0 green, 1 red, 2 setup or usage error.
 * Boundary: the work is `runConsumerGate`; it writes only under `--out`, never fetches (the caller clones), never
 *           writes the core tree (the caller builds it first; exit 2 if it is not built) and never reads or prints a
 *           secret. Each step's child output goes to its log under `--out`, never to the terminal. `--mode link`
 *           (default) links core; `--mode pack` installs tarballs of the publishable packages and adds the `leak` check.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484 (the testbed runs it); ADR 0166 (CI policy); spec
 *                     `.agents/specs/sta-1813-product-gate`; ADR 0506; STA-1966.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { CONSUMER_GATE_DEFAULTS } from "#node/consumer-gate/constants/consumer-gate-defaults.constant";
import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import { consumerGateReproduce } from "#node/consumer-gate/functions/consumer-gate-reproduce.function";
import { createConsumerGateDeps } from "#node/consumer-gate/functions/create-consumer-gate-deps.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";
import { loadConsumerGateMatrix } from "#node/consumer-gate/functions/load-consumer-gate-matrix.function";
import { renderConsumerGateSummary } from "#node/consumer-gate/functions/render-consumer-gate-summary.function";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import { CliUsageError } from "#node/errors/cli-usage.error";

/** Gates one consumer product against a core tree. */
export class ConsumerGateCommand extends Command({
  name: "consumer-gate",
  description: "Run a consumer product's services against a core tree (generate, typecheck, test)",
  bin: true,
}) {
  /** The built core tree. */
  @Option({ description: "The core tree, built (required)" })
  @Str
  core?: string;

  /** The product checkout at its pin. */
  @Option({ description: "The product checkout at its pin (required)" })
  @Str
  checkout?: string;

  /** The matrix product. */
  @Option({ description: "The product, as the matrix names it (required)" })
  @Str
  product?: string;

  /** Where the logs and summaries go. */
  @Option({ description: "Where the logs and summaries go, outside both trees (required)" })
  @Str
  out?: string;

  /** How core reaches the product. */
  @Option({
    description: "link core into the product (default), or install packed tarballs",
    choices: ["link", "pack"],
  })
  mode?: "link" | "pack";

  /** The matrix file. */
  @Option({ description: `The matrix file (default: ${CONSUMER_GATE_DEFAULTS.matrix})` })
  @Str
  matrix?: string;

  /** The allow-list file. */
  @Option({ description: `The allow-list file (default: ${CONSUMER_GATE_DEFAULTS.allow})` })
  @Str
  allow?: string;

  /** The overlaid service manifests. */
  @Option({ description: "The folder of service manifests the product does not hold" })
  @Str
  overlays?: string;

  /** Only these services. */
  @Option({ description: "Only these services, comma-separated" })
  @Str
  services?: string;

  /** Only these steps. */
  @Option({ description: `Only these steps, comma-separated: ${CONSUMER_GATE_STEPS.join(", ")}` })
  @Str
  steps?: string;

  /** The date the allow-list expiries are judged on. */
  @Option({ description: "The date allow-list entries are judged on, YYYY-MM-DD (default: today)" })
  @Str
  today?: string;

  /** Plan the steps and run none. */
  @Option({ description: "Plan the steps and run none" })
  dryRun = false;

  /**
   * Runs the gate and resolves with its exit code.
   *
   * @throws CliUsageError when a required flag is missing, `--today` is not a date, a step is unknown, or the matrix
   *         or allow-list cannot be read or is refused.
   */
  handle(io: CommandIo): number {
    const { core, checkout, product, out, mode } = this;
    if (!core || !checkout || !product || !out)
      throw new CliUsageError("--core, --checkout, --product and --out are required");
    const today = this.today ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new CliUsageError("--today must be YYYY-MM-DD");
    const matrixFile = resolve(io.cwd, this.matrix ?? CONSUMER_GATE_DEFAULTS.matrix);
    const allowFile = resolve(io.cwd, this.allow ?? CONSUMER_GATE_DEFAULTS.allow);
    const matrix = usage(() => loadConsumerGateMatrix(read(matrixFile)));
    const services = this.services?.split(",");
    const steps = this.steps?.split(",");
    const unknownStep = steps?.find((step) => !CONSUMER_GATE_STEPS.includes(step));
    if (unknownStep !== undefined)
      throw new CliUsageError(
        `unknown step ${unknownStep}; steps: ${CONSUMER_GATE_STEPS.join(", ")}`,
      );
    const allow = usage(() => loadConsumerGateAllow(read(allowFile), today));
    const overlays = this.overlays === undefined ? undefined : resolve(io.cwd, this.overlays);
    const result = runConsumerGate(
      {
        core: resolve(io.cwd, core),
        checkout: resolve(io.cwd, checkout),
        product,
        out: resolve(io.cwd, out),
        matrix,
        allow,
        ...(mode === undefined ? {} : { mode }),
        reproduce: consumerGateReproduce({
          core: resolve(io.cwd, core),
          checkout: resolve(io.cwd, checkout),
          product,
          out: resolve(io.cwd, out),
          mode,
          matrix: matrixFile,
          allow: allowFile,
          overlays,
          services: this.services,
          steps: this.steps,
          today,
          "dry-run": this.dryRun,
        }),
        ...(overlays === undefined ? {} : { overlays }),
        ...(services === undefined ? {} : { services }),
        ...(steps === undefined ? {} : { steps }),
        dryRun: this.dryRun,
        today,
      },
      createConsumerGateDeps(),
    );
    if (result.error !== undefined) io.output.error(result.error);
    else if (result.summary !== undefined) {
      if (io.json) io.output.json(result.summary);
      else io.output.line(renderConsumerGateSummary(result.summary).trimEnd());
    }
    return result.code;
  }
}

/** A file's text; an unreadable file is a usage error naming it. */
function read(path: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new CliUsageError(`cannot read ${path}`);
  }
}

/** Runs a loader; whatever it refuses is a usage error (exit 2). */
function usage<T>(load: () => T): T {
  try {
    return load();
  } catch (error) {
    throw error instanceof CliUsageError ? error : new CliUsageError((error as Error).message);
  }
}

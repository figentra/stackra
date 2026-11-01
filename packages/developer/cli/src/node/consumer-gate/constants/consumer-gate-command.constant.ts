/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_COMMAND`, `stackra consumer-gate`: given a core tree and a consumer product checkout,
 *          generate, typecheck and test the product's services against that core and write `summary-<product>.json`
 *          and `.md` (was `tools/scripts/product-gate.mjs`, STA-1813). The matrix and the allow-list are the
 *          repository's own data, by default `tools/consumer-gate/matrix.yaml` and `allow.yaml` under the working
 *          directory. Exit 0 green, 1 red, 2 setup or usage error.
 * Boundary: the work is `runConsumerGate`; it writes only under `--out`, never fetches (the caller clones), never
 *           writes the core tree (the caller builds it first; exit 2 if it is not built) and never reads or prints a
 *           secret. `--mode link` (default) links core; `--mode pack` installs tarballs of the publishable packages
 *           and adds the `leak` check.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484 (the testbed runs it); ADR 0166 (CI policy); spec
 *                     `.agents/specs/sta-1813-product-gate`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import { CONSUMER_GATE_DEFAULTS } from "#node/consumer-gate/constants/consumer-gate-defaults.constant";
import { consumerGateReproduce } from "#node/consumer-gate/functions/consumer-gate-reproduce.function";
import { createConsumerGateDeps } from "#node/consumer-gate/functions/create-consumer-gate-deps.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";
import { loadConsumerGateMatrix } from "#node/consumer-gate/functions/load-consumer-gate-matrix.function";
import { renderConsumerGateSummary } from "#node/consumer-gate/functions/render-consumer-gate-summary.function";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliCommand } from "#node/types/cli-command.type";

const text = (value: string | boolean | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

const list = (value: string | boolean | undefined): string[] | undefined => text(value)?.split(",");

/** The `stackra consumer-gate` command. */
export const CONSUMER_GATE_COMMAND: CliCommand = {
  name: "consumer-gate",
  summary: "Run a consumer product's services against a core tree (generate, typecheck, test)",
  usage:
    "stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir> [--mode link|pack] [--matrix <file>] [--allow <file>] [--overlays <dir>] [--services a,b] [--steps a,b] [--today YYYY-MM-DD] [--dry-run]",
  options: {
    core: { type: "string" },
    checkout: { type: "string" },
    product: { type: "string" },
    out: { type: "string" },
    matrix: { type: "string" },
    allow: { type: "string" },
    overlays: { type: "string" },
    services: { type: "string" },
    steps: { type: "string" },
    today: { type: "string" },
    mode: { type: "string" },
    "dry-run": { type: "boolean" },
  },
  async run({ cwd, io, values }) {
    const core = text(values["core"]);
    const checkout = text(values["checkout"]);
    const product = text(values["product"]);
    const out = text(values["out"]);
    if (!core || !checkout || !product || !out) {
      throw new CliUsageError("--core, --checkout, --product and --out are required");
    }
    const today = text(values["today"]) ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new CliUsageError("--today must be YYYY-MM-DD");
    const mode = text(values["mode"]);
    if (mode !== undefined && mode !== "link" && mode !== "pack") {
      throw new CliUsageError("--mode must be link or pack");
    }
    const read = (flag: string, fallback: string): string => {
      const path = resolve(cwd, text(values[flag]) ?? fallback);
      try {
        return readFileSync(path, "utf8");
      } catch {
        throw new CliUsageError(`cannot read ${path}`);
      }
    };
    let matrix: ReturnType<typeof loadConsumerGateMatrix>;
    try {
      matrix = loadConsumerGateMatrix(read("matrix", CONSUMER_GATE_DEFAULTS.matrix));
    } catch (error) {
      throw error instanceof CliUsageError ? error : new CliUsageError((error as Error).message);
    }
    const overlays = text(values["overlays"]);
    const services = list(values["services"]);
    const steps = list(values["steps"]);
    const unknownStep = steps?.find((step) => !CONSUMER_GATE_STEPS.includes(step));
    if (unknownStep !== undefined) {
      throw new CliUsageError(
        `unknown step ${unknownStep}; steps: ${CONSUMER_GATE_STEPS.join(", ")}`,
      );
    }
    let allow: ReturnType<typeof loadConsumerGateAllow>;
    try {
      allow = loadConsumerGateAllow(read("allow", CONSUMER_GATE_DEFAULTS.allow), today);
    } catch (error) {
      throw error instanceof CliUsageError ? error : new CliUsageError((error as Error).message);
    }
    const result = runConsumerGate(
      {
        core: resolve(cwd, core),
        checkout: resolve(cwd, checkout),
        product,
        out: resolve(cwd, out),
        matrix,
        allow,
        ...(mode === undefined ? {} : { mode }),
        reproduce: consumerGateReproduce({
          core: resolve(cwd, core),
          checkout: resolve(cwd, checkout),
          product,
          out: resolve(cwd, out),
          mode,
          matrix: resolve(cwd, text(values["matrix"]) ?? CONSUMER_GATE_DEFAULTS.matrix),
          allow: resolve(cwd, text(values["allow"]) ?? CONSUMER_GATE_DEFAULTS.allow),
          overlays: overlays === undefined ? undefined : resolve(cwd, overlays),
          services: text(values["services"]),
          steps: text(values["steps"]),
          today,
          "dry-run": values["dry-run"] === true,
        }),
        ...(overlays === undefined ? {} : { overlays: resolve(cwd, overlays) }),
        ...(services === undefined ? {} : { services }),
        ...(steps === undefined ? {} : { steps }),
        dryRun: values["dry-run"] === true,
        today,
      },
      createConsumerGateDeps(),
    );
    if (result.error !== undefined) io.err(`stackra consumer-gate: ${result.error}\n`);
    else if (result.summary !== undefined) io.out(renderConsumerGateSummary(result.summary));
    return result.code;
  },
};

/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_COMMAND`, `stackra consumer-gate`: given a core tree and a consumer product checkout,
 *          generate, typecheck and test the product's services against that core and write `summary-<product>.json`
 *          and `.md` (was `tools/scripts/product-gate.mjs`, STA-1813). The matrix and the allow-list are the
 *          repository's own data, by default `tools/consumer-gate/matrix.yaml` and `allow.yaml` under the working
 *          directory. Exit 0 green, 1 red, 2 setup or usage error.
 * Boundary: the work is `runConsumerGate`; it writes only under `--out`, never fetches (the caller clones) and never
 *           reads or prints a secret.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484 (the testbed runs it); ADR 0166 (CI policy); spec
 *                     `.agents/specs/sta-1813-product-gate`.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CONSUMER_GATE_DEFAULTS } from "#node/consumer-gate/constants/consumer-gate-defaults.constant";
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
    "stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir> [--matrix <file>] [--allow <file>] [--overlays <dir>] [--services a,b] [--steps a,b] [--core-prebuilt] [--today YYYY-MM-DD] [--dry-run]",
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
    "core-prebuilt": { type: "boolean" },
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
    const result = runConsumerGate(
      {
        core: resolve(cwd, core),
        checkout: resolve(cwd, checkout),
        product,
        out: resolve(cwd, out),
        matrix,
        allow: loadConsumerGateAllow(read("allow", CONSUMER_GATE_DEFAULTS.allow), today),
        ...(overlays === undefined ? {} : { overlays: resolve(cwd, overlays) }),
        ...(services === undefined ? {} : { services }),
        ...(steps === undefined ? {} : { steps }),
        coreBuilt: values["core-prebuilt"] === true,
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

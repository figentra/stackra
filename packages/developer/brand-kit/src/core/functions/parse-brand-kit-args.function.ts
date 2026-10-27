/**
 * Stackra file contract:
 * Purpose: `parseBrandKitArgs`, the `stackra-brand-kit` command line as run options: `--root`, `--kit-dir`,
 *          `--out-dir`, `--store-dir`, `--screenshots-dir`, `--parent-kit-dir`, `--outputs a,b` and `--check`.
 * Boundary: pure (node:util parseArgs); unknown flags and unknown output codes throw.
 * Runtime: node
 * Governing contract: ADR 0044 and ADR 0146 (config keys); ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";

import { parseArgs } from "node:util";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { BrandKitRunOptions } from "#contracts/types/brand-kit-run-options.type";

/**
 * The options `argv` gives.
 *
 * @example
 * parseBrandKitArgs(["--check", "--outputs", "tokens,heroui_css"]); // { check: true, outputs: ["tokens", "heroui_css"] }
 * @throws TypeError on an unknown flag or output code.
 */
export function parseBrandKitArgs(argv: readonly string[]): BrandKitRunOptions {
  const { values } = parseArgs({
    args: [...argv],
    strict: true,
    options: {
      root: { type: "string" },
      "kit-dir": { type: "string" },
      "out-dir": { type: "string" },
      "store-dir": { type: "string" },
      "screenshots-dir": { type: "string" },
      "parent-kit-dir": { type: "string" },
      outputs: { type: "string" },
      check: { type: "boolean" },
    },
  });
  const outputs = values.outputs?.split(",").map((code) => code.trim());
  for (const code of outputs ?? [])
    if (!Enum.values(BrandOutput).includes(code as BrandOutput))
      throw new TypeError(`Unknown output "${code}"; use ${Enum.values(BrandOutput).join(", ")}`);
  const options: Record<string, unknown> = {
    root: values.root,
    kitDir: values["kit-dir"],
    outDir: values["out-dir"],
    storeDir: values["store-dir"],
    screenshotsDir: values["screenshots-dir"],
    parentKitDir: values["parent-kit-dir"],
    outputs,
    check: values.check,
  };
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as BrandKitRunOptions;
}

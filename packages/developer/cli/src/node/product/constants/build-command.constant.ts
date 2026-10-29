/**
 * Stackra file contract:
 * Purpose: `BUILD_COMMAND`, `stackra build`: the member tool command (`toolCommand("build")`, unchanged) plus the
 *          product mode `stackra build --product [--dry-run] [--os <checkout>] [--scope <@scope>] [--env <environment>]`,
 *          which builds every surface bundle and mobile app a product's root runway names (`runBuildProduct`).
 * Boundary: data plus dispatch; a product flag without `--product` is a usage error, never ignored.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0439; ADR 0441 (decision 3); ADR 0282 (decision 3).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { toolCommand } from "#node/functions/tool-command.function";
import { runBuildProduct } from "#node/product/functions/run-build-product.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The member tool command `build` the product mode extends. */
const MEMBER_BUILD = toolCommand("build", "Generate, then build the member");

/** The flags only the product mode takes. */
const PRODUCT_FLAGS = ["dry-run", "os", "scope", "env"] as const;

/** The `stackra build` command definition. */
export const BUILD_COMMAND: CliCommand = {
  ...MEMBER_BUILD,
  summary:
    "Generate, then build the member (--product builds a product's surfaces and mobile apps)",
  usage: `${MEMBER_BUILD.usage}\n       stackra build --product [--dry-run] [--os <checkout>] [--scope <@scope>] [--env <environment>]`,
  options: {
    ...MEMBER_BUILD.options,
    product: { type: "boolean" },
    "dry-run": { type: "boolean" },
    os: { type: "string" },
    scope: { type: "string" },
    env: { type: "string" },
  },
  async run(context) {
    if (context.values["product"] === true) return runBuildProduct(context);
    const stray = PRODUCT_FLAGS.find((flag) => context.values[flag] !== undefined);
    if (stray !== undefined) throw new CliUsageError(`--${stray} needs --product`);
    return MEMBER_BUILD.run(context);
  },
};

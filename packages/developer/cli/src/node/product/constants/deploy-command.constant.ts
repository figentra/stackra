/**
 * Stackra file contract:
 * Purpose: `DEPLOY_COMMAND`, `stackra deploy --product --env <environment> [--dry-run] [--approved] [--first-release]
 *          [--assets-bucket <b>] [--assets-origin <url>] [--kv-namespace <id>] [--served <lines>]
 *          [--canary-scopes <ids>] [--region <r>]`: deploys a built product (`runDeployProduct`).
 * Boundary: data plus dispatch; only the product mode exists, so `--product` is required.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 13); ADR 0437; ADR 0439 (decision 7); ADR 0170.
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra deploy` command definition. */
export const DEPLOY_COMMAND: CliCommand = {
  name: "deploy",
  summary:
    "Deploy a built product to an environment: its surfaces to the edge, its mobile builds to the stores",
  usage:
    "stackra deploy --product --env <dev|preview|staging|production> [--dry-run] [--surfaces-only] [--approved] [--first-release] [--assets-bucket <bucket>] [--assets-origin <url>] [--kv-namespace <id>] [--served <surface@major,…>] [--canary-scopes <id,…>] [--region <region>]",
  options: {
    product: { type: "boolean" },
    env: { type: "string" },
    "dry-run": { type: "boolean" },
    "surfaces-only": { type: "boolean" },
    approved: { type: "boolean" },
    "first-release": { type: "boolean" },
    "assets-bucket": { type: "string" },
    "assets-origin": { type: "string" },
    "kv-namespace": { type: "string" },
    served: { type: "string" },
    "canary-scopes": { type: "string" },
    region: { type: "string" },
  },
  async run(context) {
    if (context.values["product"] !== true)
      throw new CliUsageError(
        "stackra deploy deploys a product: pass --product at the product root",
      );
    return runDeployProduct(context);
  },
};

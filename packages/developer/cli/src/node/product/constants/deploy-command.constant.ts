/**
 * Stackra file contract:
 * Purpose: `DEPLOY_COMMAND`. Two modes:
 *          - `stackra deploy --env <environment> [--kind <k,…>] [--member <key,…>] [--sha <sha>]
 *            [--dry-run] [--approved]` ships a commit to the environment's runway targets (`runRunwayDeploy`,
 *            STA-1921, STA-1969); in a product repository its web and mobile kinds run the product publish below with
 *            the same flags, so one command ships everything (STA-1972), unless `--member` names Worker members.
 *            The secret sync always reads the job's environment (a decrypted sops scope, ADR 0525); `--from-env` is
 *            accepted and ignored (deprecated);
 *          - `stackra deploy --product --env <environment> [--dry-run] [--surfaces-only|--mobile-only] [--approved]
 *            [--first-release] [--pr <n>] [--assets-bucket <b>] [--assets-origin <url>] [--kv-namespace <id>] [--served <lines>]
 *            [--canary-scopes <ids>] [--region <r>]` deploys a built product only (`runDeployProduct`); kept as the
 *            alias products' CI already calls.
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 1); ADR 0436 (decisions 4 and 13); ADR 0437; ADR 0439 (decision 7); ADR 0170;
 *                     ADR 0482.
 */
import { runDeployProduct } from "#node/product/functions/run-deploy-product.function";
import { runRunwayDeploy } from "#node/runway-deploy/functions/run-runway-deploy.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra deploy` command definition. */
export const DEPLOY_COMMAND: CliCommand = {
  name: "deploy",
  summary:
    "Deploy a commit to an environment's runway targets, or (--product) a built product's surfaces and mobile builds",
  usage:
    "stackra deploy --env <dev|preview|staging|production> [--kind <kind,…>] [--member <key,…>] [--sha <sha>] [--dry-run] [--approved] [the --product publish flags below, for a product's web and mobile]\n" +
    "       stackra deploy --product --env <dev|preview|staging|production> [--dry-run] [--surfaces-only|--mobile-only] [--approved] [--first-release] [--pr <n>] [--assets-bucket <bucket>] [--assets-origin <url>] [--kv-namespace <id>] [--served <surface@major,…>] [--canary-scopes <id,…>] [--region <region>]",
  options: {
    product: { type: "boolean" },
    env: { type: "string" },
    kind: { type: "string" },
    member: { type: "string" },
    sha: { type: "string" },
    // Deprecated and ignored: the secret sync always reads the job's environment (ADR 0525). figentra/tamo still
    // passes it; it goes in the next minor release.
    "from-env": { type: "boolean" },
    "dry-run": { type: "boolean" },
    "surfaces-only": { type: "boolean" },
    "mobile-only": { type: "boolean" },
    approved: { type: "boolean" },
    "first-release": { type: "boolean" },
    pr: { type: "string" },
    "assets-bucket": { type: "string" },
    "assets-origin": { type: "string" },
    "kv-namespace": { type: "string" },
    served: { type: "string" },
    "canary-scopes": { type: "string" },
    region: { type: "string" },
  },
  async run(context) {
    return context.values["product"] === true
      ? runDeployProduct(context)
      : runRunwayDeploy(context);
  },
};

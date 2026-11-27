/**
 * Stackra file contract:
 * Purpose: `DeployCommand`, `stackra deploy --env <environment>`: deploys a commit to the environment's runway targets, or
 *          with `--product` a built product's surfaces and mobile builds. The body is `DEPLOY_COMMAND`, unchanged.
 * Boundary: the environment's approval, lock and secret sync are the body's; no secret value passes through an argument.
 * Runtime: node
 * Governing contract: ADR 0482; ADR 0525; ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { DEPLOY_COMMAND } from "#node/product/constants/deploy-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Deploys to an environment. */
export class DeployCommand extends Command({
  name: "deploy",
  description: DEPLOY_COMMAND.summary,
  group: "Deploy",
  bin: true,
  examples: [
    "stackra deploy --env staging --dry-run",
    "stackra deploy --product --env preview --pr 42",
  ],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = DEPLOY_COMMAND;

  /** Deploy a built product's surfaces and mobile builds instead of the runway targets */
  @Option({
    description:
      "Deploy a built product's surfaces and mobile builds instead of the runway targets",
  })
  product = false;

  /** The environment: dev, preview, staging or production */
  @Option({ description: "The environment: dev, preview, staging or production" })
  @Str
  env?: string;

  /** Only these target kinds, comma-separated */
  @Option({ description: "Only these target kinds, comma-separated" })
  @Str
  kind?: string;

  /** Only these members, comma-separated */
  @Option({ description: "Only these members, comma-separated" })
  @Str
  member?: string;

  /** The commit to deploy (default: HEAD) */
  @Option({ description: "The commit to deploy (default: HEAD)" })
  @Str
  sha?: string;

  /** Deprecated and ignored: the secret sync always reads the job's environment (ADR 0525) */
  @Option({
    description:
      "Deprecated and ignored: the secret sync always reads the job's environment (ADR 0525)",
  })
  fromEnv = false;

  /** Plan only; deploy nothing */
  @Option({ description: "Plan only; deploy nothing" })
  dryRun = false;

  /** With --product: the web surfaces only */
  @Option({ description: "With --product: the web surfaces only" })
  surfacesOnly = false;

  /** With --product: the mobile builds only */
  @Option({ description: "With --product: the mobile builds only" })
  mobileOnly = false;

  /** The environment's approval was given (checked against the job's OIDC token) */
  @Option({
    description: "The environment's approval was given (checked against the job's OIDC token)",
  })
  approved = false;

  /** With --product: the product's first release */
  @Option({ description: "With --product: the product's first release" })
  firstRelease = false;

  /** With --product: the pull request a preview belongs to */
  @Option({ description: "With --product: the pull request a preview belongs to" })
  @Str
  pr?: string;

  /** With --product: the bucket the assets go to */
  @Option({ description: "With --product: the bucket the assets go to" })
  @Str
  assetsBucket?: string;

  /** With --product: the origin the assets are served from */
  @Option({ description: "With --product: the origin the assets are served from" })
  @Str
  assetsOrigin?: string;

  /** With --product: the KV namespace of the edge */
  @Option({ description: "With --product: the KV namespace of the edge" })
  @Str
  kvNamespace?: string;

  /** With --product: the surface majors served, surface@major comma-separated */
  @Option({
    description: "With --product: the surface majors served, surface@major comma-separated",
  })
  @Str
  served?: string;

  /** With --product: the scopes that get the canary, comma-separated */
  @Option({ description: "With --product: the scopes that get the canary, comma-separated" })
  @Str
  canaryScopes?: string;

  /** With --product: the region */
  @Option({ description: "With --product: the region" })
  @Str
  region?: string;

  /** Deploys; the exit code is the deploy's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, DEPLOY_COMMAND, {
      values: {
        product: this.product,
        env: this.env,
        kind: this.kind,
        member: this.member,
        sha: this.sha,
        "from-env": this.fromEnv,
        "dry-run": this.dryRun,
        "surfaces-only": this.surfacesOnly,
        "mobile-only": this.mobileOnly,
        approved: this.approved,
        "first-release": this.firstRelease,
        pr: this.pr,
        "assets-bucket": this.assetsBucket,
        "assets-origin": this.assetsOrigin,
        "kv-namespace": this.kvNamespace,
        served: this.served,
        "canary-scopes": this.canaryScopes,
        region: this.region,
      },
    });
  }
}

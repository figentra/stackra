/**
 * Stackra file contract:
 * Purpose: `awsBaselineConfig(root, environment, origins)`, one environment's AWS foundation config from the root
 *          runway: its account and whether it owns the account's account-wide resources, the cost tags, the budget
 *          (stopping spend only where production does not run), the Postgres backups (point-in-time recovery and
 *          35-day snapshot copies in the backup account), the files bucket (when a service default puts files or
 *          media on the `s3` disk), the static egress addresses, the jurisdiction, the GitHub repository and the
 *          Encore Cloud account link. Backups never leave the jurisdiction: an environment with backups whose AWS
 *          regions are not the foundation's region, or sit in another jurisdiction, is refused.
 * Boundary: plain data in and out, so gen can write the result as `<env>.infra.config.json`; account ids, amounts and
 *           the Encore link stay `ref:<path>` until the Pulumi program resolves them. The app origins come from gen,
 *           which knows the app members' hosts; the root runway does not list them.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 1 to 4), ADR 0172 (decisions 1, 2 and 5), ADR 0186 (decisions 1 to 3 as
 *                     amended 2026-10-24), ADR 0289 (decision 5), ADR 0222 (media direct uploads), ADR 0353 (residency),
 *                     ADR 0402 (backups stay in the jurisdiction; static egress addresses).
 */
import { RunwayEnvironment, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { PITR_DAYS } from "#core/constants/pitr-days.constant";
import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { SNAPSHOT_DAYS } from "#core/constants/snapshot-days.constant";
import { accountsFrom } from "#core/functions/accounts-from.function";
import { costTags } from "#core/functions/cost-tags.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { AwsBaselineConfig } from "#core/types/aws-baseline-config.type";
import type { InfraRunway } from "#core/types/infra-runway.type";

/** An origin a browser uploads from: https, a host, an optional port and nothing else. */
const ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

/** Whether a service default puts files or media on the `s3` disk, so the files bucket (and its replica) exists. */
function onS3Of(settings: InfraRunway["environments"][string] | undefined): boolean {
  const config = settings?.defaults?.service?.config;
  return config?.filesystem?.disk === "s3" || config?.media?.disk === "s3";
}

/**
 * The AWS foundation config of `environment`.
 *
 * @param root - the parsed root runway (`readRunway("runway.yaml", "root")`).
 * @param environment - the environment the Pulumi stack deploys.
 * @param origins - the app origins that upload files straight to the bucket (`https://console.acme.example`).
 * @throws RunwayInvalidError when the environment names no account, a budget has no amount for its account, backups
 *         have no backup account or would be copied out of an environment region's jurisdiction, or an `encore-cloud`
 *         environment has no Encore account link.
 * @throws TypeError when an origin is not `https://<host>[:port]`.
 * @example
 * const config = awsBaselineConfig(root, "staging", ["https://console.staging.acme.example"]);
 * config.database; // null: staging declares no backups
 */
export function awsBaselineConfig(
  root: RootRunway,
  environment: RunwayEnvironment,
  origins: readonly string[] = [],
): AwsBaselineConfig {
  for (const origin of origins)
    if (!ORIGIN.test(origin))
      throw new TypeError(`${origin} is not an upload origin: expected https://<host>[:port]`);

  const runway = parseInfraRunway(root);
  const accounts = accountsFrom(runway);
  const own = accounts.environments.find((entry) => entry.environment === environment);
  if (own === undefined)
    throw new RunwayInvalidError(ROOT_SOURCE, [
      {
        path: `environments.${environment}.encore.account`,
        message: "Name the AWS account (a key of providers.aws.accounts) this environment runs in",
      },
    ]);

  const { aws, github, encore } = runway.providers;
  const settings = runway.environments[environment];
  const sameAccount = accounts.environments.filter((entry) => entry.name === own.name);
  const issues: RunwayIssue[] = [];

  let budgets: AwsBaselineConfig["budgets"] = null;
  if (aws.budgets !== undefined) {
    const monthly = aws.budgets.monthlyUsd[own.name];
    const production = sameAccount.some(
      (entry) => entry.environment === RunwayEnvironment.Production,
    );
    if (monthly === undefined)
      issues.push({
        path: `providers.aws.budgets.monthlyUsd.${own.name}`,
        message: `Set the monthly budget of the "${own.name}" account`,
      });
    else
      budgets = {
        monthlyUsd: String(monthly),
        thresholds: aws.budgets.thresholds,
        stopAt: production ? null : (aws.budgets.stopNonProdAt ?? null),
      };
  }

  const backups = settings?.shared?.database?.backups;
  if (backups !== undefined && accounts.backup === null)
    issues.push({
      path: "providers.aws.accounts.backup",
      message: "Database backups are copied to a backup account (ADR 0186): name it",
    });

  // Backups and replicas land in `providers.aws.region`; each AWS region the environment serves must be that region.
  const home = Object.values(runway.regions).find(
    (region) => region.cloud === "aws" && region.location === aws.region,
  );
  if (backups !== undefined || onS3Of(settings))
    for (const key of settings?.regions ?? []) {
      const region = runway.regions[key];
      if (region?.cloud !== "aws" || region.location === aws.region) continue;
      const where = [region.location, region.jurisdiction].filter(Boolean).join(", ");
      const to = [aws.region, home?.jurisdiction].filter(Boolean).join(", ");
      issues.push({
        path: `environments.${environment}.regions`,
        message: `"${key}" (${where}) would back up to ${to}: give that region its own account and stack`,
      });
    }

  const onS3 = onS3Of(settings);
  const buckets = settings?.shared?.buckets;
  const egress = settings?.shared?.network?.egress;

  const onEncore = settings?.destinations?.services === "encore-cloud";
  if (onEncore && (encore?.awsAccountId === undefined || encore.externalId === undefined))
    issues.push({
      path: "providers.encore",
      message:
        "Set awsAccountId and externalId from the Encore Cloud AWS connection (ref:<path> values)",
    });

  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);

  return {
    project: runway.project,
    environment,
    region: aws.region,
    account: own.account,
    ownsAccount: sameAccount[0]?.environment === environment,
    sharesAccount: sameAccount.length > 1,
    backupAccount: accounts.backup,
    tags: costTags(runway.project, environment, aws.requiredTags),
    budgets,
    database:
      backups === undefined
        ? null
        : {
            pitrDays: backups.pitr === true ? PITR_DAYS : null,
            snapshotDays: backups.retentionDays ?? SNAPSHOT_DAYS,
          },
    files: onS3
      ? {
          versioning: buckets?.versioning ?? true,
          expireNoncurrentDays: buckets?.lifecycle?.expireNoncurrentDays ?? null,
          origins: [...origins],
        }
      : null,
    egress: egress === undefined ? null : { staticIps: egress.staticIps },
    jurisdiction: home?.jurisdiction ?? null,
    github:
      github?.org !== undefined && github.repo !== undefined
        ? { org: github.org, repo: github.repo }
        : null,
    encore:
      onEncore && encore?.awsAccountId !== undefined && encore.externalId !== undefined
        ? { accountId: encore.awsAccountId, externalId: encore.externalId }
        : null,
  };
}

/**
 * Stackra file contract:
 * Purpose: `logPipeline(args)`, where telemetry goes (ADR 0184 decisions 1, 2 and 5): one Better Stack OpenTelemetry
 *          source every service exports OTLP to, its logs searchable for `hotDays`, and, when `coldMonths` is above
 *          0, an S3 archive the source writes to and keeps after the hot period, whose objects expire after
 *          `coldMonths` calendar months. Returns the OTLP endpoint (`https://<ingesting host>`) and the source token
 *          as a secret output.
 * Boundary: declares Pulumi resources only, in the account of the stack's AWS provider (the core stack's, ADR 0171
 *           decision 6). Better Stack writes the archive with an access key (its only mode), so the key belongs to a
 *           user that may only list, read, write and delete in that bucket; the secret lives in the encrypted
 *           Pulumi state and Better Stack, never in git or a file. The provider's API token (`logtail:apiToken`) is
 *           the owner's stack config.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0184 (decisions 1, 2 and 5: OTLP everywhere, 30 days hot and 13 months in S3), ADR 0171
 *                     (decisions 4 and 6), ADR 0173 (no secret value in git).
 *                     STA-1220 (the return type is written out, so the declaration emit names the provider classes
 *                     through the package entry, not their `bin/` files).
 */
import * as pulumi from "@pulumi/pulumi";
import * as logtail from "pulumi-logtail";

import { logArchive } from "#node/functions/log-archive.function";

/**
 * The archive (when `coldMonths` is above 0), the source, and what a service exports to.
 *
 * @param args - the project (names the source and prefixes the archive), the hot days and the cold months.
 * @example
 * const { endpoint, token } = logPipeline({ project: "acme-platform", hotDays: 30, coldMonths: 13 });
 */
export function logPipeline(args: {
  readonly project: string;
  readonly hotDays: number;
  readonly coldMonths: number;
}): {
  readonly archive: ReturnType<typeof logArchive> | undefined;
  readonly source: logtail.Source;
  readonly endpoint: pulumi.Output<string>;
  readonly token: pulumi.Output<string>;
} {
  const { project, hotDays, coldMonths } = args;
  const archive = coldMonths === 0 ? undefined : logArchive(`logs-archive-${project}`, coldMonths);
  const source = new logtail.Source(`telemetry-${project}`, {
    name: project,
    platform: "open_telemetry",
    logsRetention: hotDays,
    ...(archive === undefined
      ? {}
      : {
          customBucket: {
            endpoint: pulumi.interpolate`https://${archive.bucket.bucketRegionalDomainName}`,
            accessKeyId: archive.accessKey.id,
            secretAccessKey: archive.accessKey.secret,
            keepDataAfterRetention: true,
          },
        }),
  });
  return {
    archive,
    source,
    endpoint: pulumi.interpolate`https://${source.ingestingHost}`,
    token: pulumi.secret(source.token),
  };
}

/**
 * Stackra file contract:
 * Purpose: the AWS Secrets Manager driver of the `SecretStore` port (driver name `aws-secrets-manager`): `load()` reads
 *          the configured secrets in batches of twenty with the runtime's AWS role and keeps them in memory; `get(name)`
 *          answers from that copy. A JSON-object secret gives one secret per string member; any other value is one
 *          secret under the secret's name.
 * Boundary: server only. The AWS SDK is an optional peer imported on the first `load`, so loading `./node` never
 *           needs it installed. `get` is synchronous by the port's contract, so the host that binds this store awaits
 *           `load()` before it answers (and may reload it with `scheduleSecretReload`; `bootApp` binds it at boot only
 *           with STA-2804); a `get` before the first load throws. A load swaps the copy only when every id was read, so
 *           a failed reload keeps the last good values. Every request has limits: `connectionTimeout` 3 s,
 *           `requestTimeout` `timeoutMs` (it throws, never only warns) and at most three attempts, because the SDK's
 *           defaults set no time limit and a dropped connection would hang the load forever. Values live in a private
 *           map, are never listed, logged or put in an error: a failed load names the secret ids that failed, never a
 *           value. No credential is configured: the SDK's default chain (the role) signs every call.
 * Runtime: node
 * Governing contract: ADR 0173 (nobody reads a value; secrets by name); ADR 0146 as amended by 0305 (rule 34); ADR
 *                     0294 (decision 16); ADR 0171 (AWS accounts per product and region).
 */
import { Driver } from "@stackra/container";

import type { AwsSecretsManagerConfig } from "#config/aws-secrets-manager.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { secretEntriesOf } from "#core/functions/secret-entries-of.function";

/** The most ids one `BatchGetSecretValue` call takes. */
const BATCH = 20;

/** Milliseconds to open a connection to Secrets Manager. */
const CONNECTION_TIMEOUT_MS = 3000;

/** How many times one request is tried, the first included. */
const MAX_ATTEMPTS = 3;

/**
 * Reads secrets from AWS Secrets Manager.
 *
 * @example
 * const store = new AwsSecretsManagerSecretStoreDriver(buildConfig(AwsSecretsManagerConfig, { values }));
 * await store.load();
 */
export class AwsSecretsManagerSecretStoreDriver extends Driver(SecretStore) {
  private readonly config: AwsSecretsManagerConfig;

  private values: ReadonlyMap<string, string> | undefined;

  /**
   * @param config - the region, the secret ids and the per-request timeout.
   */
  constructor(config: AwsSecretsManagerConfig) {
    super();
    this.config = config;
  }

  /**
   * Reads every configured secret, replacing what an earlier load read.
   *
   * @throws Error when the region or the ids are missing, or a secret cannot be read (ids only, no value).
   */
  async load(): Promise<void> {
    const { region, secretIds, timeoutMs } = this.config;
    if (region === "" || secretIds.length === 0)
      throw new Error(
        "The aws-secrets-manager secret store needs a region and at least one secret id",
      );
    // The SDK is an optional peer, imported here so a host that never loads this store never needs it installed.
    const { BatchGetSecretValueCommand, SecretsManagerClient } =
      await import("@aws-sdk/client-secrets-manager");
    const client = new SecretsManagerClient({
      region,
      maxAttempts: MAX_ATTEMPTS,
      requestHandler: {
        connectionTimeout: CONNECTION_TIMEOUT_MS,
        requestTimeout: timeoutMs,
        throwOnRequestTimeout: true,
      },
    });
    const values = new Map<string, string>();
    const failed: string[] = [];
    try {
      for (let start = 0; start < secretIds.length; start += BATCH) {
        // oxlint-disable-next-line no-await-in-loop -- batches one after the other, under the API's rate limit
        const answer = await client.send(
          new BatchGetSecretValueCommand({ SecretIdList: secretIds.slice(start, start + BATCH) }),
        );
        for (const secret of answer.SecretValues ?? [])
          if (secret.Name !== undefined && secret.SecretString !== undefined)
            for (const [name, value] of secretEntriesOf(secret.Name, secret.SecretString))
              values.set(name, value);
        for (const error of answer.Errors ?? []) failed.push(error.SecretId ?? "(unknown)");
      }
    } finally {
      client.destroy();
    }
    if (failed.length > 0)
      throw new Error(`AWS Secrets Manager could not read: ${failed.join(", ")}`);
    this.values = values;
  }

  /**
   * See `SecretStore.get`: the loaded value of `name`, or `undefined` when the store has none.
   *
   * @throws Error before the first `load`.
   */
  get(name: string): string | undefined {
    if (this.values === undefined)
      throw new Error(
        "The aws-secrets-manager secret store is not loaded: await store.load() at boot",
      );
    return this.values.get(name);
  }
}

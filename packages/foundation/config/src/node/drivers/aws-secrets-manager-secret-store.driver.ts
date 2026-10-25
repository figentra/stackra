/**
 * Stackra file contract:
 * Purpose: the AWS Secrets Manager driver of the `SecretStore` port (driver name `aws-secrets-manager`): `load()` reads
 *          the configured secrets in batches of twenty with the runtime's AWS role and keeps them in memory; `get(name)`
 *          answers from that copy. A JSON-object secret gives one secret per string member; any other value is one
 *          secret under the secret's name.
 * Boundary: server only (the AWS SDK). `get` is synchronous by the port's contract, so the runtime awaits `load()` at
 *           boot (and again after a rotation); a `get` before the first load throws. Values live in a private map, are
 *           never listed, logged or put in an error: a failed load names the secret ids that failed, never a value. No
 *           credential is configured: the SDK's default chain (the role) signs every call.
 * Runtime: node
 * Governing contract: ADR 0173 (nobody reads a value; secrets by name); ADR 0146 as amended by 0305 (rule 34); ADR
 *                     0294 (decision 16); ADR 0171 (AWS accounts per product and region).
 */
import { BatchGetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Driver } from "@stackra/container";

import { AwsSecretsManagerConfig } from "#config/aws-secrets-manager.config";
import { SecretStore } from "#contracts/ports/secret-store.port";

/** The most ids one `BatchGetSecretValue` call takes. */
const BATCH = 20;

/** The secrets one secret value gives, by name. */
function entriesOf(name: string, text: string): readonly (readonly [string, string])[] {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
      return Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      );
  } catch {
    // Not JSON: one secret under the secret's name.
  }
  return [[name, text]];
}

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

  /** @param config - the region and the secret ids. */
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
    const { region, secretIds } = this.config;
    if (region === "" || secretIds.length === 0)
      throw new Error(
        "The aws-secrets-manager secret store needs a region and at least one secret id",
      );
    const client = new SecretsManagerClient({ region });
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
            for (const [name, value] of entriesOf(secret.Name, secret.SecretString))
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
   * See `SecretStore.get`.
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

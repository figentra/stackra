/**
 * Stackra file contract:
 * Purpose: the Google Secret Manager driver of the `SecretStore` port (driver name `gcp_secret_manager`): `load()`
 *          asks the platform's metadata server for the runtime's own service-account token, reads each configured
 *          secret's version (`latest` unless pinned with `@<version>`), eight at a time, through the global endpoint or
 *          the configured location's regional endpoint, and keeps them in memory; `get(name)` answers from that copy.
 *          A JSON-object secret gives one secret per string member; any other value is one secret under the secret's
 *          id.
 * Boundary: server only, on Google Cloud compute (Cloud Run, GKE with Workload Identity, Compute Engine), where the
 *           metadata server issues the token: no key is configured anywhere. It calls the REST API with `fetch`, so no
 *           SDK is installed. Every request has `timeoutMs`; a slow or failed request fails the load, which then
 *           swaps nothing, so a failed reload keeps the last good values. Values live in a private map, are never
 *           listed, logged or put in an error: a failed load names the step, the ids and an HTTP status, never a
 *           value or a token.
 * Runtime: node
 * Governing contract: ADR 0371 (amendment 2026-11-27, STA-258: closes open question 2; decision 5, residency); ADR
 *                     0354 (two clouds); ADR 0173 (nobody reads a value; secrets by name); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import type { GcpSecretManagerConfig } from "#config/gcp-secret-manager.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { secretEntriesOf } from "#core/functions/secret-entries-of.function";

/** The metadata server's token of the runtime's default service account. */
const TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";

/** How many secrets are read at once. */
const CONCURRENCY = 8;

/** Why one request failed: an HTTP status, a timeout or no answer; never its body. */
function reasonOf(error: unknown): string {
  return (error as { name?: unknown } | null)?.name === "TimeoutError" ? "timeout" : "unreachable";
}

/**
 * The JSON body of `response`, or undefined when it cannot be read or parsed: a parse error quotes the body, which
 * may hold a value, so it never leaves here.
 */
async function jsonOf<T>(response: Response): Promise<T | undefined> {
  try {
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

/**
 * Reads secrets from Google Secret Manager.
 *
 * @example
 * const store = new GcpSecretManagerSecretStoreDriver(
 *   buildConfig(GcpSecretManagerConfig, { values: { project: "acme-staging", secretIds: ["RESEND_API_KEY"] } }),
 * );
 * await store.load();
 */
export class GcpSecretManagerSecretStoreDriver extends Driver(SecretStore) {
  private readonly config: GcpSecretManagerConfig;

  private values: ReadonlyMap<string, string> | undefined;

  /**
   * @param config - the project, location, secret ids and request timeout.
   */
  constructor(config: GcpSecretManagerConfig) {
    super();
    this.config = config;
  }

  /**
   * Reads every configured secret, replacing what an earlier load read only when all of them were read.
   *
   * @throws Error when the project or the ids are missing, the metadata server gives no token, or a secret cannot be
   *         read (ids and statuses only, no value).
   */
  async load(): Promise<void> {
    const { project, location, secretIds, timeoutMs } = this.config;
    if (project === "" || secretIds.length === 0)
      throw new Error(
        "The gcp-secret-manager secret store needs a project and at least one secret id",
      );
    const token = await this.token(timeoutMs);
    const base =
      location === ""
        ? `https://secretmanager.googleapis.com/v1/projects/${project}`
        : `https://secretmanager.${location}.rep.googleapis.com/v1/projects/${project}/locations/${location}`;
    const values = new Map<string, string>();
    const failed: string[] = [];
    for (let start = 0; start < secretIds.length; start += CONCURRENCY) {
      const batch = secretIds.slice(start, start + CONCURRENCY);
      // oxlint-disable-next-line no-await-in-loop -- a few requests at a time, under the API's per-minute quota
      const answers = await Promise.all(batch.map((id) => this.access(base, id, token, timeoutMs)));
      for (const answer of answers)
        if ("text" in answer)
          for (const [name, value] of secretEntriesOf(answer.name, answer.text))
            values.set(name, value);
        else failed.push(`${answer.id} (${answer.reason})`);
    }
    if (failed.length > 0)
      throw new Error(`Google Secret Manager could not read: ${failed.join(", ")}`);
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
        "The gcp-secret-manager secret store is not loaded: await store.load() at boot",
      );
    return this.values.get(name);
  }

  /** The runtime's own access token, from the metadata server. */
  private async token(timeoutMs: number): Promise<string> {
    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new Error(
        `The gcp-secret-manager secret store got no token: the metadata server is ${reasonOf(error)} (is this Google Cloud compute?)`,
        { cause: error },
      );
    }
    const body = response.ok ? await jsonOf<{ access_token?: unknown }>(response) : undefined;
    if (body === undefined || typeof body.access_token !== "string" || body.access_token === "")
      throw new Error(
        `The gcp-secret-manager secret store got no token from the metadata server (status ${response.status})`,
      );
    return body.access_token;
  }

  /** One secret version's text, or why it could not be read. */
  private async access(
    base: string,
    id: string,
    token: string,
    timeoutMs: number,
  ): Promise<
    | { readonly name: string; readonly text: string }
    | { readonly id: string; readonly reason: string }
  > {
    const [name = id, version = "latest"] = id.split("@");
    let response: Response;
    try {
      response = await fetch(`${base}/secrets/${name}/versions/${version}:access`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      return { id, reason: reasonOf(error) };
    }
    if (!response.ok) return { id, reason: String(response.status) };
    const body = await jsonOf<{ payload?: { data?: unknown } }>(response);
    if (body === undefined) return { id, reason: "unreadable answer" };
    const data = body.payload?.data;
    if (typeof data !== "string") return { id, reason: "no payload" };
    return { name, text: Buffer.from(data, "base64").toString("utf8") };
  }
}

/**
 * Stackra file contract:
 * Purpose: the Infisical driver of the `SecretStore` port (driver name `infisical`): `load()` signs in with the
 *          configured machine identity (universal auth) and reads every secret of one project, environment and folder
 *          into memory; `get(name)` answers from that copy.
 * Boundary: web-standard `fetch` only, so it runs in a service and a Worker. `get` is synchronous by the port's
 *           contract, so the runtime awaits `load()` at boot (and again to pick up a rotation); a `get` before the
 *           first load throws, so a missing load never reads as a missing secret. Values live in a private map, are
 *           never listed, logged or put in an error: a failed load names the step and the HTTP status only. The access
 *           token is used for the one read and not kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (nobody reads a value; secrets by name); ADR 0146 as amended by 0305 (rule 34); ADR
 *                     0294 (decision 16); the Infisical universal-auth and raw-secrets API.
 */
import { Driver } from "@stackra/container";

import { InfisicalConfig } from "#config/infisical.config";
import { SecretStore } from "#contracts/ports/secret-store.port";

/** The login answer this driver reads. */
interface Login {
  readonly accessToken?: unknown;
}

/** The secrets answer this driver reads. */
interface Secrets {
  readonly secrets?: readonly { readonly secretKey?: unknown; readonly secretValue?: unknown }[];
}

/**
 * Reads secrets from Infisical.
 *
 * @example
 * const store = new InfisicalSecretStoreDriver(buildConfig(InfisicalConfig, { values, secrets: platform }));
 * await store.load();
 * buildConfig(MailConfig, { secrets: store });
 */
export class InfisicalSecretStoreDriver extends Driver(SecretStore) {
  private readonly config: InfisicalConfig;

  private values: ReadonlyMap<string, string> | undefined;

  /** @param config - the instance, project, environment, folder and machine identity. */
  constructor(config: InfisicalConfig) {
    super();
    this.config = config;
  }

  /**
   * Reads every secret of the configured folder, replacing what an earlier load read.
   *
   * @throws Error when the configuration is incomplete, or the sign-in or the read fails (status only, no value).
   */
  async load(): Promise<void> {
    const { siteUrl, projectId, environment, path, clientId, clientSecret } = this.config;
    if (
      siteUrl === "" ||
      projectId === "" ||
      environment === "" ||
      clientId === "" ||
      clientSecret === ""
    )
      throw new Error(
        "The infisical secret store needs siteUrl, projectId, environment and the INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET secrets",
      );
    const base = siteUrl.replace(/\/+$/, "");
    const login = await globalThis.fetch(`${base}/api/v1/auth/universal-auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!login.ok) throw new Error(`Infisical sign-in failed with HTTP ${login.status}`);
    const { accessToken } = (await login.json()) as Login;
    if (typeof accessToken !== "string") throw new Error("Infisical sign-in returned no token");
    const query = new URLSearchParams({
      workspaceId: projectId,
      environment,
      secretPath: path,
      expandSecretReferences: "true",
    });
    const read = await globalThis.fetch(`${base}/api/v3/secrets/raw?${query.toString()}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!read.ok) throw new Error(`Infisical secret read failed with HTTP ${read.status}`);
    const values = new Map<string, string>();
    for (const secret of ((await read.json()) as Secrets).secrets ?? [])
      if (typeof secret.secretKey === "string" && typeof secret.secretValue === "string")
        values.set(secret.secretKey, secret.secretValue);
    this.values = values;
  }

  /**
   * See `SecretStore.get`.
   *
   * @throws Error before the first `load`.
   */
  get(name: string): string | undefined {
    if (this.values === undefined)
      throw new Error("The infisical secret store is not loaded: await store.load() at boot");
    return this.values.get(name);
  }
}

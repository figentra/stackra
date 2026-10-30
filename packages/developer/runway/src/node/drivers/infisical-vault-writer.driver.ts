/**
 * Stackra file contract:
 * Purpose: `InfisicalVaultWriterDriver`, the Infisical driver of the `VaultWriter` port: writes one secret by
 *          `<environment>:<path>` and name, creating its folder when missing and replacing a value that exists.
 * Boundary: `fetch` only, to Infisical's API (`INFISICAL_API_URL`, default app.infisical.com) with the job's
 *           `INFISICAL_TOKEN` from its OIDC login, into the project `INFISICAL_PROJECT_ID` (an organisation variable).
 *           The value travels only in the request body; it is never read back, listed, logged or put in an error.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 7), ADR 0173, ADR 0257.
 */
import { Driver } from "@stackra/container";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { VaultWriter } from "#core/ports/vault-writer.port";
import { MOBILE_ONBOARD_SETTINGS } from "#node/constants/mobile-onboard-settings.constant";
import { requestJson } from "#node/functions/request-json.function";
import { secretOf } from "#node/functions/secret-of.function";

/**
 * Infisical, written blind.
 *
 * @example
 * const vault = new InfisicalVaultWriterDriver();
 * await vault.write("prod:/ci/store/academorix", "FCM_SERVICE_ACCOUNT_JSON", key);
 */
export class InfisicalVaultWriterDriver extends Driver(VaultWriter) {
  /** The job's environment; a test replaces it. */
  env: Readonly<Record<string, string | undefined>> = process.env;

  /** `fetch`; a test replaces it. */
  fetch: typeof fetch = globalThis.fetch;

  /** Creates or replaces the secret. */
  override async write(path: string, name: string, value: string): Promise<void> {
    const match = /^([a-z0-9-]+):(\/[A-Za-z0-9_/-]*)$/.exec(path);
    if (match === null)
      throw new RunwayUnresolvedError(`Expected <environment>:/<path>, not ${path}`);
    const [, environment = "", secretPath = "/"] = match;
    const base = this.env["INFISICAL_API_URL"] ?? MOBILE_ONBOARD_SETTINGS.infisicalApi;
    const headers = { authorization: `Bearer ${secretOf(this.env, "INFISICAL_TOKEN")}` };
    const workspaceId = secretOf(this.env, "INFISICAL_PROJECT_ID");

    // Each folder of the path, parent first; an existing one answers 400 and is left.
    const parts = secretPath.split("/").filter((part) => part !== "");
    for (let index = 0; index < parts.length; index += 1)
      await requestJson(this.fetch, {
        what: "Infisical: create folder",
        method: "POST",
        url: `${base}/api/v1/folders`,
        headers,
        body: {
          workspaceId,
          environment,
          name: parts[index],
          path: `/${parts.slice(0, index).join("/")}`,
        },
        accept: [400, 409],
      });

    const body = { workspaceId, environment, secretPath, secretValue: value, type: "shared" };
    const url = `${base}/api/v3/secrets/raw/${encodeURIComponent(name)}`;
    const created = await requestJson(this.fetch, {
      what: `Infisical: create ${name}`,
      method: "POST",
      url,
      headers,
      body,
      accept: [400, 409],
    });
    if (created.status === 400 || created.status === 409)
      await requestJson(this.fetch, {
        what: `Infisical: replace ${name}`,
        method: "PATCH",
        url,
        headers,
        body,
      });
  }
}

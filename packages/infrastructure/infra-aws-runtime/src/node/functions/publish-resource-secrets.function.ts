/**
 * Stackra file contract:
 * Purpose: `publishResourceSecrets(plan, request)`, after `pulumi up`: writes each Postgres resource's connection
 *          details to Infisical at `<environment>:/runtime/<resource>` under its variable names (`_HOST`, `_PORT`,
 *          `_USER`, and `_URL` with the password and `sslmode=require`), so the Infisical sync hands them to every
 *          consumer that `uses` the resource.
 * Boundary: runs in the deploy job only, from the applied stack's outputs and the passwords `ensureDatabasePasswords`
 *           gave the program. Never logs a value; writes through the `VaultWriter` port. Returns the names written.
 * Runtime: node
 * Governing contract: ADR 0493 (decision 4), ADR 0473 (consumers connect through RDS Proxy), ADR 0173.
 */
import type { VaultWriter } from "@stackra/runway";

import { resourceVariables } from "#core/functions/resource-variables.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { RESOURCE_SECRETS_SETTINGS } from "#node/constants/resource-secrets-settings.constant";

/**
 * Writes each database's connection details and answers the variable names written, by resource.
 *
 * @param request - `endpoints` are the applied proxy endpoints and ports by plan key; `passwords` the admin passwords
 *        by plan key; `vaultEnvironment` the Infisical environment slug.
 * @throws TypeError when a database has no endpoint or password.
 * @example
 * await publishResourceSecrets(plan, { vault, vaultEnvironment: "prod", endpoints, passwords });
 */
export async function publishResourceSecrets(
  plan: RuntimePlan,
  request: {
    readonly vault: VaultWriter;
    readonly vaultEnvironment: string;
    readonly endpoints: Readonly<Record<string, { readonly host: string; readonly port: number }>>;
    readonly passwords: Readonly<Record<string, string>>;
  },
): Promise<Record<string, string[]>> {
  const written: Record<string, string[]> = {};
  for (const database of plan.databases) {
    const endpoint = request.endpoints[database.key];
    const password = request.passwords[database.key];
    if (endpoint === undefined || password === undefined)
      throw new TypeError(`No applied endpoint or password for ${database.key}`);
    const names = resourceVariables(database.resource);
    const user = RESOURCE_SECRETS_SETTINGS.adminUser;
    // shortcut: consumers connect as the admin user, until per-service roles exist (ADR 0238 decision 3).
    const values: [string, string][] = [
      [names.host, endpoint.host],
      [names.port, String(endpoint.port)],
      [names.user, user],
      [
        names.url,
        `postgres://${user}:${encodeURIComponent(password)}@${endpoint.host}:${endpoint.port}/postgres?sslmode=require`,
      ],
    ];
    const path = `${request.vaultEnvironment}:${RESOURCE_SECRETS_SETTINGS.folder}/${database.resource}`;
    for (const [name, value] of values) await request.vault.write(path, name, value);
    written[database.resource] = values.map(([name]) => name);
  }
  return written;
}

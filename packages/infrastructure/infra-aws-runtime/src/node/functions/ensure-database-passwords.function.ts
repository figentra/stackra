/**
 * Stackra file contract:
 * Purpose: `ensureDatabasePasswords(plan, request)`, each Postgres resource's admin password for the Pulumi program,
 *          by plan key: the one the deploy job already has (`<RESOURCE>_PASSWORD`, from the Infisical sync), or, the
 *          first time, a new random one written blind to Infisical at `<environment>:/runtime/<resource>` before it
 *          is used, so a later run reuses it instead of rotating it.
 * Boundary: runs in the deploy job only. A value lives in a local and the returned Pulumi secret; it is never logged,
 *           printed or written to disk. Writes go through the `VaultWriter` port.
 * Runtime: node
 * Governing contract: ADR 0493 (decision 4), ADR 0482 (decision 7: generated keys written blind), ADR 0173.
 */
import { randomBytes } from "node:crypto";

import * as pulumi from "@pulumi/pulumi";
import type { VaultWriter } from "@stackra/runway";

import { resourceVariables } from "#core/functions/resource-variables.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { RESOURCE_SECRETS_SETTINGS } from "#node/constants/resource-secrets-settings.constant";

/**
 * The admin password of each database in `plan`.
 *
 * @param request - `vault` writes a new password; `env` is the job's environment; `vaultEnvironment` is the Infisical
 *        environment slug of the plan's environment (`prod` for production).
 * @example
 * const passwords = await ensureDatabasePasswords(plan, { vault, env: process.env, vaultEnvironment: "prod" });
 * awsRuntime(plan, { network, databasePasswords: passwords });
 */
export async function ensureDatabasePasswords(
  plan: RuntimePlan,
  request: {
    readonly vault: VaultWriter;
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly vaultEnvironment: string;
  },
): Promise<Record<string, pulumi.Output<string>>> {
  const passwords: Record<string, pulumi.Output<string>> = {};
  for (const database of plan.databases) {
    const name = resourceVariables(database.resource).password;
    let value = request.env[name];
    if (value === undefined || value === "") {
      value = randomBytes(RESOURCE_SECRETS_SETTINGS.passwordBytes).toString("base64url");
      await request.vault.write(
        `${request.vaultEnvironment}:${RESOURCE_SECRETS_SETTINGS.folder}/${database.resource}`,
        name,
        value,
      );
    }
    passwords[database.key] = pulumi.secret(value);
  }
  return passwords;
}

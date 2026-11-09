/**
 * Stackra file contract:
 * Purpose: `ensureGotenbergCredentials(plan, request)`, before `pulumi up`: each `gotenberg` resource's basic-auth
 *          password, the first time a new random one written blind to the vault, so the engine reads it as
 *          `GOTENBERG_API_BASIC_AUTH_PASSWORD` (`<environment>:/workloads/<resource>`) and every consumer that `uses`
 *          the resource reads `DOCUMENTS_GOTENBERG_URL` and `DOCUMENTS_GOTENBERG_AUTHORIZATION`
 *          (`<environment>:/runtime/<resource>`), DocumentsConfig's own names. A later run that has the password reuses
 *          it instead of rotating it.
 * Boundary: runs in the deploy job only. A value lives in locals only: it is never logged, printed or written to
 *           disk, and writes go through the `VaultWriter` port. The URL is the engine's private DNS name
 *           (`<resource>.<env>.workloads.<project>.internal`), the one `awsWorkloads` registers.
 * Runtime: node
 * Governing contract: ADR 0493 (as amended: the gotenberg resource), ADR 0482 (decision 7: generated keys written
 *                     blind), ADR 0173.
 */
import { randomBytes } from "node:crypto";

import type { VaultWriter } from "@stackra/runway";

import { GOTENBERG_SETTINGS } from "#core/constants/gotenberg-settings.constant";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { RESOURCE_SECRETS_SETTINGS } from "#node/constants/resource-secrets-settings.constant";

/**
 * Writes each new engine's credentials and answers the names written, by resource; an engine whose password the job
 * already has writes nothing.
 *
 * @param request - `vault` writes the values; `env` is the job's environment; `vaultEnvironment` is the vault's
 *        environment slug of the plan's environment (`prod` for production).
 * @example
 * await ensureGotenbergCredentials(plan, { vault, env: process.env, vaultEnvironment: "staging" });
 */
export async function ensureGotenbergCredentials(
  plan: RuntimePlan,
  request: {
    readonly vault: VaultWriter;
    readonly env: Readonly<Record<string, string | undefined>>;
    readonly vaultEnvironment: string;
  },
): Promise<Record<string, string[]>> {
  const written: Record<string, string[]> = {};
  for (const engine of plan.workloads) {
    const resource = engine.gotenberg?.resource;
    if (resource === undefined) continue;
    const existing = request.env[GOTENBERG_SETTINGS.serverPassword];
    if (existing !== undefined && existing !== "") continue;
    const password = randomBytes(RESOURCE_SECRETS_SETTINGS.passwordBytes).toString("base64url");
    const basic = Buffer.from(`${GOTENBERG_SETTINGS.user}:${password}`).toString("base64");
    const host = `${engine.workload}.${plan.environment}.workloads.${plan.project}.internal`;
    // oxlint-disable-next-line no-await-in-loop -- reason: one engine per runway; the writes go in order
    await request.vault.write(
      `${request.vaultEnvironment}:/workloads/${engine.workload}`,
      GOTENBERG_SETTINGS.serverPassword,
      password,
    );
    // oxlint-disable-next-line no-await-in-loop -- reason: as above
    await request.vault.write(
      `${request.vaultEnvironment}:${RESOURCE_SECRETS_SETTINGS.folder}/${resource}`,
      GOTENBERG_SETTINGS.url,
      `http://${host}:${GOTENBERG_SETTINGS.port}`,
    );
    // oxlint-disable-next-line no-await-in-loop -- reason: as above
    await request.vault.write(
      `${request.vaultEnvironment}:${RESOURCE_SECRETS_SETTINGS.folder}/${resource}`,
      GOTENBERG_SETTINGS.authorization,
      `Basic ${basic}`,
    );
    written[resource] = [
      GOTENBERG_SETTINGS.serverPassword,
      GOTENBERG_SETTINGS.url,
      GOTENBERG_SETTINGS.authorization,
    ];
  }
  return written;
}

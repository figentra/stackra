/**
 * Stackra file contract:
 * Purpose: `RUNWAY_SECRETS_FROM_SOPS_CODEMOD`, 0.19.0: runway, doctor and `mcp exec` move from Infisical to sops (ADR
 *          0525).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 1f33c82.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Runway, doctor and mcp exec read secrets from sops, not Infisical. */
export const RUNWAY_SECRETS_FROM_SOPS_CODEMOD: UpgradeCodemod = {
  id: "runway-secrets-from-sops",
  version: "0.19.0",
  title: "Runway, doctor and mcp exec read secrets from sops, not Infisical",
  note: "The secret sync and the Workers provider read every declared secret from the job's environment, where .github/actions/secrets-decrypt put the product's sops scope products/<project>/<env>. Remove providers.infisical and secrets.defaultPath from runway.yaml (validate warns for one release), replace workflow Infisical secret-name: steps with secrets-decrypt names:, and drop --project-id from runway env check and env orphans. In code: deployPlan gives secretScope (was infisicalEnvironment), SecretSyncEntry gives scope (was path), readMemberSecrets takes env (no source or run), syncSecrets takes no fromEnv, McpExecOptions is { secretsDir? } (stackra mcp exec has no --env or --path), InfisicalVaultWriterDriver and MobileOnboardRequest.vault are removed, and DoctorWorkspace.infisical is gone. stackra gen drops home from the manifest env rows.",
  source: "1f33c82, 5d6448a, bac874e, ADR 0525",
};

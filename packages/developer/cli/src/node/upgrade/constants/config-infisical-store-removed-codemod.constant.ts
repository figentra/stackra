/**
 * Stackra file contract:
 * Purpose: `CONFIG_INFISICAL_STORE_REMOVED_CODEMOD`, 0.19.0: `@stackra/config` no longer ships the Infisical secret
 *          store; the codemod reports each import of its removed names, since the replacement is a deployment choice.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0525; STA-145; changeset cb26737.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Secrets from SOPS files, not Infisical. */
export const CONFIG_INFISICAL_STORE_REMOVED_CODEMOD: UpgradeCodemod = {
  id: "config-infisical-store-removed",
  version: "0.19.0",
  title: "The Infisical secret store is removed from @stackra/config",
  note: "InfisicalSecretStoreDriver, InfisicalConfig, InfisicalConfig$ and InfisicalOptions are removed, with the infisical candidate of the SecretStore port and the INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET env rows (ADR 0525). The SecretStore candidates are memory and aws_secrets_manager; a deployed runtime reads the platform's store through envSecrets. The codemod lists each import to remove; stackra gen then drops the infisical candidate from the committed manifest.",
  source: "cb26737, ADR 0525",
  report: {
    modules: ["@stackra/config"],
    rule: {
      kind: "import_specifier",
      has: {
        field: "name",
        regex: "^(InfisicalSecretStoreDriver|InfisicalConfig\\$?|InfisicalOptions)$",
      },
      inside: {
        kind: "import_statement",
        stopBy: "end",
        has: { field: "source", regex: "^[\"']@stackra/config[\"']$" },
      },
    },
    message:
      "remove this import: the Infisical store is gone; select the memory or aws_secrets_manager SecretStore driver, or envSecrets",
  },
};

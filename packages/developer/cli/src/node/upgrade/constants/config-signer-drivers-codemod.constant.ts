/**
 * Stackra file contract:
 * Purpose: `CONFIG_SIGNER_DRIVERS_CODEMOD`, 0.32.0: a service that injects `Signer` binds `kms` in production and
 *          configures it.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 9ddce28.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Signer has kms and ephemeral drivers, configured by config.signer. */
export const CONFIG_SIGNER_DRIVERS_CODEMOD: UpgradeCodemod = {
  id: "config-signer-drivers",
  version: "0.32.0",
  title: "Signer has kms and ephemeral drivers, configured by config.signer",
  note: "A service that injects @stackra/contracts' Signer binds kms in production, sets config.signer.kmsKeyId (and region) in its runway, and adds @aws-sdk/client-kms to its dependencies; ephemeral is for tests and local development.",
  source: "9ddce28",
};

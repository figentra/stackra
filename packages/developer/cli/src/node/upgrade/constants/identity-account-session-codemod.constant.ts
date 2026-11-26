/**
 * Stackra file contract:
 * Purpose: `IDENTITY_ACCOUNT_SESSION_CODEMOD`, 0.9.0: identity's `DeviceSession` (the SecurityPage's session row) is
 *          renamed `AccountSession`; the codemod renames the import and every use in the file.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; changeset 378f6a6 (STA-1978).
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** One `DeviceSession` name in the workspace. */
export const IDENTITY_ACCOUNT_SESSION_CODEMOD: UpgradeCodemod = {
  id: "identity-account-session",
  version: "0.9.0",
  title: "DeviceSession of @stackra/identity/contracts is renamed AccountSession",
  note: "The SecurityPage's signed-in session row, from the AccountSecurity port, is AccountSession, so it no longer shares a name with @stackra/native-spotlight's DeviceSession. The codemod renames the import and its uses; a re-export keeps its public name through an alias.",
  source: "378f6a6, STA-1978",
  renames: [
    {
      name: "DeviceSession",
      from: ["@stackra/identity/contracts"],
      to: "@stackra/identity/contracts",
      rename: "AccountSession",
    },
  ],
};

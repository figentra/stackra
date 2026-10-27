/**
 * Stackra file contract:
 * Purpose: `AppApprovalSheetOptions`, what `useAppApprovalSheet` calls: `load`, `approve`, `deny` and `redeem` (the
 *          app's generated client for `AppApprovalService.pending`, `.approve`, `.deny` and `.redeem`) and `verify`,
 *          the device's biometric check.
 * Boundary: a type only. The server reads the principal and the bound device from the authenticated call.
 * Runtime: react-native
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import type { AppApprovalPrompt } from "#core/index";

/** What the hook calls. */
export interface AppApprovalSheetOptions {
  /** The pending prompts of the signed-in principal on this device. */
  readonly load: () => Promise<readonly AppApprovalPrompt[]>;

  /** Approves with the picked number (none after a scan); `true` when approved, `false` when the number was wrong. */
  readonly approve: (id: string, number?: number) => Promise<boolean>;

  /** Denies. */
  readonly deny: (id: string) => Promise<void>;

  /** Redeems a scanned QR token into a prompt. */
  readonly redeem: (qrToken: string) => Promise<AppApprovalPrompt>;

  /** The device's biometric check; `false` sends nothing. */
  readonly verify: () => Promise<boolean>;
}

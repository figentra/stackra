/**
 * Stackra file contract:
 * Purpose: `AppleWalletOptions`, the deployment's Apple Wallet data: the pass type id, the team id, the organisation
 *          name and the pass style of each pass kind.
 * Boundary: a type only; configuration the host reads from the Apple Wallet Connection or its config, never code. The
 *           pass-type certificate and key are not here: they are secrets behind the `CmsSigner` (ADR 0348 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0356 (configuration, not code).
 */
import type { AppleWalletStyle } from "#node/pass/apple-wallet-style.type";

/** The deployment's Apple Wallet data. */
export interface AppleWalletOptions {
  /** The pass type identifier registered with Apple (`pass.com.example.loyalty`). */
  readonly passTypeIdentifier: string;

  /** The Apple developer team id. */
  readonly teamIdentifier: string;

  /** The organisation name shown on the lock screen and in Wallet. */
  readonly organizationName: string;

  /** The style of each pass kind by its key (`{ loyalty_card: "storeCard" }`); `generic` for a kind not listed. */
  readonly styles?: Readonly<Record<string, AppleWalletStyle>>;
}

/**
 * Stackra file contract:
 * Purpose: `GoogleWalletOptions`, the deployment's Google Wallet data: the issuer id, the generic class of each pass
 *          kind, the service account that signs save links, the name of the secret holding its key and how long a
 *          save link lives.
 * Boundary: a type only; configuration the host reads from the Google Wallet Connection or its config, never code.
 *           The key is a secret name (`GOOGLE_WALLET_ISSUER_KEY`, ADR 0348 decision 5), never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0173; ADR 0356 (configuration, not code);
 *                     owner D10 2026-10-28 (stackra-223: `Duration` replaced `Interval`).
 */
import type { Duration } from "@stackra/contracts";

/** The deployment's Google Wallet data. */
export interface GoogleWalletOptions {
  /** The Google Wallet issuer id. */
  readonly issuerId: string;

  /** The generic class suffix of each pass kind by its key (`{ loyalty_card: "loyalty" }`); the key when not listed. */
  readonly classes?: Readonly<Record<string, string>>;

  /** The service account's e-mail, the `iss` of a save link. */
  readonly serviceAccountEmail: string;

  /** The secret holding the service account's PKCS #8 PEM private key; `GOOGLE_WALLET_ISSUER_KEY` when left out. */
  readonly keySecret?: string;

  /** How long a save link stays valid after it is issued; `Duration.days(1)` when left out. */
  readonly saveLinkLifetime?: Duration;
}

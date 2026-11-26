/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.tls-verification-disabled` (`ruleid:` lines must match, `ok:` must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/tls-verification-disabled.yml; ADR 0187 decision 3; STA-2821.
 */
import { Agent } from "node:https";

declare const ca: string;

// ruleid: stackra.tls-verification-disabled
export const insecure = new Agent({ keepAlive: true, rejectUnauthorized: false });
// ruleid: stackra.tls-verification-disabled
export const noIdentity = new Agent({ checkServerIdentity: () => undefined });
// ok: stackra.tls-verification-disabled
export const privateCa = new Agent({ ca, rejectUnauthorized: true });

export function disableGlobally(): void {
  // ruleid: stackra.tls-verification-disabled
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

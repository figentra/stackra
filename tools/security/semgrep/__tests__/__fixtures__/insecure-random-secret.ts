/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.insecure-random-secret` (`ruleid:` lines must match, `ok:` must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/insecure-random-secret.yml; ADR 0187 decision 3; STA-2821.
 */
// ruleid: stackra.insecure-random-secret
export const resetToken = Math.random().toString(36).slice(2);

export function makeNonce(): string {
  // ruleid: stackra.insecure-random-secret
  return String(Math.floor(Math.random() * 1e9));
}

export const invite = {
  // ruleid: stackra.insecure-random-secret
  inviteCode: Math.random().toString(36),
  // ok: stackra.insecure-random-secret
  colour: Math.random() > 0.5 ? "lime" : "ink",
};

// ok: stackra.insecure-random-secret
export const jitterMs = Math.random() * 250;
// ok: stackra.insecure-random-secret
export const sessionToken = crypto.randomUUID();

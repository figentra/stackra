/**
 * Stackra file contract:
 * Purpose: `consentSnapshotHeaders(options)`, the client half of the consent endpoint (ADR 0472 decisions 1 and 3): a
 *          function a `ClientSession.headers()` spreads, which answers `{ "Stackra-Consent": token }` with a snapshot
 *          the consent endpoint signed (`POST /consent/snapshots`), fetched again when the decision changed or the
 *          snapshot is a minute from expiry.
 * Boundary: holds one snapshot per function in memory and never stores it. Concurrent calls share one fetch. A failed
 *           or malformed answer sends no header (a missing snapshot reads as refused on the server, and never fails
 *           the call), unless the held snapshot still answers the same decision and has not expired. The token is
 *           opaque here; only the server verifies it. Browser and native alike: a native app passes its ledger's
 *           `snapshotRequest`.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 1, 3 and 4; consequences: a refusal is fetched at once); ADR 0298.
 */
import { CONSENT_SNAPSHOT_HEADER } from "#contracts/constants/consent-snapshot-header.constant";
import { CONSENT_SNAPSHOT_PATH } from "#contracts/constants/consent-snapshot-path.constant";
import type { ConsentSnapshotHeadersOptions } from "#core/types/consent-snapshot-headers-options.type";

/** How long before its expiry a held snapshot is fetched again. */
const REFRESH_MARGIN_MS = 60_000;

/** A snapshot held for one decision. */
interface Held {
  readonly decision: string;
  readonly token: string;
  readonly expiresAt: number;
}

/**
 * The headers that carry the visitor's consent snapshot on each call.
 *
 * @example
 * const consentHeaders = consentSnapshotHeaders({ baseUrl: apiOrigin, snapshotRequest: () => ledger.snapshotRequest() });
 * async headers() {
 *   return { ...(await authHeaders()), ...(await consentHeaders()) };
 * }
 */
export function consentSnapshotHeaders(
  options: ConsentSnapshotHeadersOptions,
): () => Promise<Readonly<Record<string, string>>> {
  const now = options.now ?? Date.now;
  const url = `${options.baseUrl.replace(/\/$/, "")}${CONSENT_SNAPSHOT_PATH}`;
  let held: Held | undefined;
  let pending:
    | { readonly decision: string; readonly answer: Promise<Held | undefined> }
    | undefined;

  async function issue(body: string): Promise<Held | undefined> {
    try {
      const response = await (options.fetch ?? globalThis.fetch)(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
      });
      if (!response.ok) return undefined;
      const answer = (await response.json()) as { token?: unknown; expiresAt?: unknown };
      const expiresAt =
        typeof answer.expiresAt === "string" ? Date.parse(answer.expiresAt) : Number.NaN;
      if (typeof answer.token !== "string" || answer.token === "" || Number.isNaN(expiresAt))
        return undefined;
      return { decision: body, token: answer.token, expiresAt };
    } catch {
      // A network failure sends no header: the server reads the call as refused and still serves it.
      return undefined;
    }
  }

  return async () => {
    const decision = JSON.stringify(options.snapshotRequest());
    if (held?.decision !== decision || held.expiresAt - REFRESH_MARGIN_MS <= now()) {
      if (pending?.decision !== decision) {
        const answer = issue(decision);
        pending = { decision, answer };
        void answer.finally(() => {
          if (pending?.answer === answer) pending = undefined;
        });
      }
      const fresh = await pending.answer;
      if (fresh !== undefined) held = fresh;
    }
    return held?.decision === decision && held.expiresAt > now()
      ? { [CONSENT_SNAPSHOT_HEADER]: held.token }
      : {};
  };
}

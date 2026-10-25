/**
 * Stackra file contract:
 * Purpose: `checkLicenceKey`, the opt-in online check for a connected install: asks Keygen's `validate-key` action
 *          whether the licence key is valid, scoped to this machine's fingerprint when one is given.
 * Boundary: the only network call in the package, and never made unless the install opted in (ADR 0178 decision 5:
 *           no phone-home by default). Sent through a `Transport`; the key goes in the body, never the URL. A status
 *           other than 200 or a body without `meta.valid` refuses with `LicenceCheckUnavailableError`, which the caller
 *           treats as "keep the offline standing". The key is never stored or logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0260 (calls go through the transport).
 */
import { createTransport } from "@stackra/transport";

import { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";
import { isRecord } from "#core/functions/is-record.function";
import type { LicenceKeyCheck } from "#core/types/licence-key-check.type";
import type { LicenceKeyCheckOptions } from "#core/types/licence-key-check-options.type";

/** Keygen's hosted API origin. */
const KEYGEN_API_URL = "https://api.keygen.sh";

/** Keygen speaks JSON:API. */
const JSON_API = "application/vnd.api+json";

/**
 * Checks a licence key online.
 *
 * @example
 * const check = await checkLicenceKey({ account, licenceKey, fingerprint, transport });
 * if (!check.valid) logger.warn("licence check failed", { code: check.code });
 * @throws LicenceCheckUnavailableError when Keygen gives no verdict.
 */
export async function checkLicenceKey(options: LicenceKeyCheckOptions): Promise<LicenceKeyCheck> {
  const send = options.transport ?? createTransport();
  const url = `${options.baseUrl ?? KEYGEN_API_URL}/v1/accounts/${encodeURIComponent(options.account)}/licenses/actions/validate-key`;
  const meta =
    options.fingerprint === undefined
      ? { key: options.licenceKey }
      : { key: options.licenceKey, scope: { fingerprint: options.fingerprint } };
  const response = await send(
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": JSON_API, Accept: JSON_API },
      body: JSON.stringify({ meta }),
    }),
  );
  if (response.status !== 200) {
    await response.body?.cancel();
    throw LicenceCheckUnavailableError.create({ status: response.status });
  }
  const body: unknown = await response.json().catch(() => undefined);
  const verdict = isRecord(body) && isRecord(body.meta) ? body.meta : undefined;
  if (verdict === undefined || typeof verdict.valid !== "boolean")
    throw LicenceCheckUnavailableError.create({ status: response.status });
  return {
    valid: verdict.valid,
    code: typeof verdict.code === "string" ? verdict.code : "",
    detail: typeof verdict.detail === "string" ? verdict.detail : "",
  };
}

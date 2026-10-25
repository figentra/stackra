/**
 * Stackra file contract:
 * Purpose: `hubSender`, the one call path of the HTTP drivers: a transport with an `Idempotency-Key`, the device's
 *          bearer token, retries and a timeout, under `DevicesConfig.hubUrl`, turning a failure status into a refusal.
 * Boundary: internal to the package. The token is read once per call, outside the retries, and never logged. A 401 or
 *           403 throws `DeviceUnauthorizedError`; any other failure status throws `DeviceHubRefusedError` once `retry`
 *           has given up; a network failure or `RequestTimedOutError` from the last attempt passes through as it is.
 *           A refused body is cancelled unread.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decisions 1 and 2); ADR 0260 (clients call through the transport); ADR 0138
 *                     (idempotency).
 */
import { Duration } from "@stackra/contracts";
import { bearerToken, createTransport, idempotencyKey, retry, timeout } from "@stackra/transport";

import type { DevicesConfig } from "#config/devices.config";
import type { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";
import { DeviceUnauthorizedError } from "#core/errors/device-unauthorized.error";

/**
 * The sender of hub calls, `path` relative to the hub URL and starting with `/`.
 *
 * @throws TypeError when `config.hubUrl` is `null`.
 * @example
 * const send = hubSender(config, credential);
 * const response = await send(DEVICE_HUB_PATHS.commands);
 */
export function hubSender(
  config: DevicesConfig,
  credential: DeviceCredential,
): (path: string, init?: RequestInit) => Promise<Response> {
  if (config.hubUrl === null)
    throw new TypeError(
      "DevicesConfig.hubUrl is not set: the HTTP device drivers need the hub's URL",
    );
  const base = config.hubUrl.replace(/\/+$/, "");
  const send = createTransport({
    middleware: [
      idempotencyKey(),
      bearerToken(() => credential.token()),
      retry({ attempts: config.attempts }),
      timeout(Duration.seconds(config.timeoutMs / 1000)),
    ],
  });
  return async (path, init = {}) => {
    const response = await send(new Request(`${base}${path}`, init));
    if (response.ok) return response;
    await response.body?.cancel();
    const details = { status: response.status };
    if (response.status === 401 || response.status === 403)
      throw DeviceUnauthorizedError.create(details);
    throw DeviceHubRefusedError.create(details);
  };
}

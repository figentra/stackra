/**
 * Stackra file contract:
 * Purpose: the HTTP driver of the `DevicePairing` port. `begin` mints a pairing secret, keeps it in the `secrets` area
 *          and sends it with the install id in the body of `POST /device-pairings` for a code to show. `check` polls
 *          `GET /device-pairings/:pairingId?deviceId=` (this install's id), which answers the state only; once
 *          paired it picks the credential up once with `POST /device-pairings/:pairingId/pickup` (the secret in the
 *          body), keeps the token in the `secrets` area where `StoredDeviceCredentialDriver` reads it and drops the
 *          secret. A pickup the hub refuses as not ready yet (409: identity has not issued the credential) reads as
 *          pending.
 * Boundary: calls through `hubSender` with the bound `DeviceCredential`, which answers no token before pairing. Bodies
 *           come from outside and are parsed with `PAIRING_CODE_SCHEMA`, `PAIRING_STATUS_SCHEMA` and
 *           `PAIRING_PICKUP_SCHEMA` (a malformed body throws `ZodError`). No URL carries the secret or the token; both
 *           are written to storage and flushed, never returned or logged. Any other pickup refusal (a wrong or spent
 *           secret) throws `DeviceHubRefusedError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import type { Storage } from "@stackra/storage/contracts";

import type { DevicesConfig } from "#config/devices.config";
import { PairingState } from "#contracts/enums/pairing-state.enum";
import type { DeviceCredential } from "#contracts/ports/device-credential.port";
import type { DeviceIdentity } from "#contracts/ports/device-identity.port";
import { DevicePairing } from "#contracts/ports/device-pairing.port";
import type { PairingCode } from "#contracts/types/pairing-code.type";
import type { PairingStatus } from "#contracts/types/pairing-status.type";
import { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
import { PAIRING_CODE_SCHEMA } from "#core/constants/pairing-code-schema.constant";
import { PAIRING_PICKUP_SCHEMA } from "#core/constants/pairing-pickup-schema.constant";
import { PAIRING_STATUS_SCHEMA } from "#core/constants/pairing-status-schema.constant";
import { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";
import { hubSender } from "#core/functions/hub-sender.function";
import { newPairingSecret } from "#core/functions/new-pairing-secret.function";

/** The hub's answer to a pickup before the credential is ready (a `Conflict` refusal). */
const NOT_READY = 409;

/** Pairs this device over HTTP. */
export class HttpDevicePairingDriver extends Driver(DevicePairing) {
  private readonly send: ReturnType<typeof hubSender>;

  /** This install's id. */
  private readonly identity: DeviceIdentity;

  /** Where the pairing secret and the token are kept. */
  private readonly storage: Storage;

  /**
   * @param config - the hub URL, timeout and attempts.
   * @param credential - the device's token, none before pairing.
   * @param identity - this install's id.
   * @param storage - the device app's storage.
   * @throws TypeError when `config.hubUrl` is `null`.
   */
  constructor(
    config: DevicesConfig,
    credential: DeviceCredential,
    identity: DeviceIdentity,
    storage: Storage,
  ) {
    super();
    this.send = hubSender(config, credential);
    this.identity = identity;
    this.storage = storage;
  }

  /** Asks the hub for a code for this install, with a fresh pairing secret kept for the pickup. */
  async begin(): Promise<PairingCode> {
    const secret = newPairingSecret();
    this.storage.secrets.set(DEVICE_STORAGE_KEYS.pairingSecret, secret);
    await this.storage.flush();
    const response = await this.send(DEVICE_HUB_PATHS.pairings, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: await this.identity.id(), secret }),
    });
    return PAIRING_CODE_SCHEMA.parse(await response.json());
  }

  /** The pairing's state; once paired, picks up the token with the kept secret and keeps it. */
  async check(pairing: PairingCode): Promise<PairingStatus> {
    const query = new URLSearchParams({ deviceId: await this.identity.id() });
    const response = await this.send(`${DEVICE_HUB_PATHS.pairing(pairing.pairingId)}?${query}`);
    const status = PAIRING_STATUS_SCHEMA.parse(await response.json());
    const secret = this.storage.secrets.get(DEVICE_STORAGE_KEYS.pairingSecret);
    // no kept secret once paired: the token was already picked up (or this install never opened the pairing)
    if (status.state !== PairingState.Paired || typeof secret !== "string" || secret === "")
      return { state: status.state, deviceId: status.deviceId };
    let picked: Response;
    try {
      picked = await this.send(DEVICE_HUB_PATHS.pickup(pairing.pairingId), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      });
    } catch (error) {
      if (isRefusal(error, DeviceHubRefusedError) && error.status === NOT_READY)
        return { state: PairingState.Pending, deviceId: null };
      throw error;
    }
    const { deviceId, token } = PAIRING_PICKUP_SCHEMA.parse(await picked.json());
    this.storage.secrets.set(DEVICE_STORAGE_KEYS.token, token);
    this.storage.secrets.delete(DEVICE_STORAGE_KEYS.pairingSecret);
    await this.storage.flush();
    return { state: PairingState.Paired, deviceId };
  }

  /** Drops the kept token and any open pairing's secret. */
  async forget(): Promise<void> {
    this.storage.secrets.delete(DEVICE_STORAGE_KEYS.token);
    this.storage.secrets.delete(DEVICE_STORAGE_KEYS.pairingSecret);
    await this.storage.flush();
  }
}

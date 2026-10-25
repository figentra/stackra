/**
 * Stackra file contract:
 * Purpose: the HTTP driver of the `DevicePairing` port: `POST /device-pairings` with the install id for a code to show,
 *          `GET /device-pairings/:pairingId` until a person has entered it, and, once paired, the hub's token kept in
 *          the `secrets` area where `StoredDeviceCredentialDriver` reads it.
 * Boundary: calls through `hubSender` with the bound `DeviceCredential`, which answers no token before pairing. Bodies
 *           come from outside and are parsed with `PAIRING_CODE_SCHEMA` and `PAIRING_STATUS_SCHEMA` (a malformed body
 *           throws `ZodError`). The token is written to storage and flushed, never returned or logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";
import { Storage } from "@stackra/storage/contracts";

import { DevicesConfig } from "#config/devices.config";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DeviceIdentity } from "#contracts/ports/device-identity.port";
import { DevicePairing } from "#contracts/ports/device-pairing.port";
import type { PairingCode } from "#contracts/types/pairing-code.type";
import type { PairingStatus } from "#contracts/types/pairing-status.type";
import { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";
import { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
import { PAIRING_CODE_SCHEMA } from "#core/constants/pairing-code-schema.constant";
import { PAIRING_STATUS_SCHEMA } from "#core/constants/pairing-status-schema.constant";
import { hubSender } from "#core/functions/hub-sender.function";

/** Pairs this device over HTTP. */
export class HttpDevicePairingDriver extends Driver(DevicePairing) {
  private readonly send: ReturnType<typeof hubSender>;

  /** This install's id. */
  private readonly identity: DeviceIdentity;

  /** Where the token is kept. */
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

  /** Asks the hub for a code for this install. */
  async begin(): Promise<PairingCode> {
    const response = await this.send(DEVICE_HUB_PATHS.pairings, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: await this.identity.id() }),
    });
    return PAIRING_CODE_SCHEMA.parse(await response.json());
  }

  /** The pairing's state; when paired, keeps the token and flushes storage first. */
  async check(pairing: PairingCode): Promise<PairingStatus> {
    const response = await this.send(DEVICE_HUB_PATHS.pairing(pairing.pairingId));
    const { state, deviceId, token } = PAIRING_STATUS_SCHEMA.parse(await response.json());
    if (token !== null) {
      this.storage.secrets.set(DEVICE_STORAGE_KEYS.token, token);
      await this.storage.flush();
    }
    return { state, deviceId };
  }

  /** Drops the kept token. */
  async forget(): Promise<void> {
    this.storage.secrets.delete(DEVICE_STORAGE_KEYS.token);
    await this.storage.flush();
  }
}

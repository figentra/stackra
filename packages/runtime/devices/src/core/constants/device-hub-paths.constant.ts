/**
 * Stackra file contract:
 * Purpose: `DEVICE_HUB_PATHS`, the routes the HTTP drivers call under `DevicesConfig.hubUrl`, so the hub service that
 *          serves them and the drivers share one spelling.
 * Boundary: data only. The routes follow the endpoint convention of the HTTP rule: the action `device.report` is
 *           `POST /devices/report`, the query `device_command.list` is `GET /device-commands` and the action
 *           `device_command.acknowledge` (input has `deviceCommandId`) is
 *           `PUT /device-commands/:deviceCommandId/acknowledge`; pairing is `POST /device-pairings`,
 *           `GET /device-pairings/:pairingId` (state only) and `POST /device-pairings/:pairingId/pickup` (the one-time
 *           credential pickup). No route names a device: the hub reads it from the credential, except the pairing
 *           calls, which carry the install id because the device has no credential yet. No route carries a secret: the
 *           pairing secret travels in the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0217 as amended (endpoint convention); ADR 0294 (decision 21).
 */

/**
 * The hub's device routes.
 *
 * @example
 * DEVICE_HUB_PATHS.acknowledge("cmd_1"); // "/device-commands/cmd_1/acknowledge"
 */
export const DEVICE_HUB_PATHS = Object.freeze({
  /** `POST`: a batch of telemetry readings. */
  report: "/devices/report",
  /** `GET`: the commands pending for the calling device. */
  commands: "/device-commands",
  /** `PUT`: ends one command; the id is URI-encoded. */
  acknowledge: (commandId: string): string =>
    `/device-commands/${encodeURIComponent(commandId)}/acknowledge`,
  /** `POST`: opens a pairing for the calling install (`{ deviceId, secret }`), answering its code. */
  pairings: "/device-pairings",
  /** `GET`: one pairing's state, never a credential; the id is URI-encoded. */
  pairing: (pairingId: string): string => `/device-pairings/${encodeURIComponent(pairingId)}`,
  /** `POST`: the one-time credential pickup of a paired pairing (`{ secret }`); the id is URI-encoded. */
  pickup: (pairingId: string): string => `/device-pairings/${encodeURIComponent(pairingId)}/pickup`,
});

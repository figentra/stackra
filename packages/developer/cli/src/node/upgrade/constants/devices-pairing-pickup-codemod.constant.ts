/**
 * Stackra file contract:
 * Purpose: `DEVICES_PAIRING_PICKUP_CODEMOD`, 0.19.0: device pairing needs a hub that serves the token pickup.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset e0298ce.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Device pairing picks the token up with a pairing secret. */
export const DEVICES_PAIRING_PICKUP_CODEMOD: UpgradeCodemod = {
  id: "devices-pairing-pickup",
  version: "0.19.0",
  title: "Device pairing picks the token up with a pairing secret",
  note: "HttpDevicePairingDriver.begin sends a 256-bit pairing secret in POST /device-pairings, check polls GET /device-pairings/:pairingId for the state only, and the token is picked up once from POST /device-pairings/:pairingId/pickup. Deploy a device hub that serves the pickup (figentra/os devices) before apps on this release pair.",
  source: "e0298ce",
};

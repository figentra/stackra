/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/devices, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The ports, `CommandStatus` and the wire types are not here:
 *           they are exported from `./contracts` only (ADR 0294 decision 15). The shipped schema is re-exported under
 *           its generated name (`DevicesConfig$`). `hubSender` and the hub body schemas stay internal; the pairing code
 *           alphabet and generator are public so a registry driver (the OS devices service's) draws codes the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note;
 *                     STA-1257 (public pairing code).
 */
export { DevicesConfig } from "#config/devices.config";
export { BASE_DEVICE_CATALOGUE } from "#core/constants/base-device-catalogue.constant";
export { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";
export { DEVICE_STORAGE_KEYS } from "#core/constants/device-storage-keys.constant";
export { DEVICES_CONFIG_SCHEMA as DevicesConfig$ } from "#core/constants/devices-config-schema.constant";
export { PAIRING_CODE_ALPHABET } from "#core/constants/pairing-code-alphabet.constant";
export { HttpDeviceCommandsDriver } from "#core/drivers/http-device-commands.driver";
export { HttpDevicePairingDriver } from "#core/drivers/http-device-pairing.driver";
export { HttpDeviceTelemetryDriver } from "#core/drivers/http-device-telemetry.driver";
export { MemoryDeviceRegistryDriver } from "#core/drivers/memory-device-registry.driver";
export { StoredDeviceCredentialDriver } from "#core/drivers/stored-device-credential.driver";
export { StoredDeviceIdentityDriver } from "#core/drivers/stored-device-identity.driver";
export { DeviceHubRefusedError } from "#core/errors/device-hub-refused.error";
export { DeviceUnauthorizedError } from "#core/errors/device-unauthorized.error";
export { PairingCodeInvalidError } from "#core/errors/pairing-code-invalid.error";
export { deviceCatalogueOf } from "#core/functions/device-catalogue-of.function";
export { newPairingCode } from "#core/functions/new-pairing-code.function";
export { DevicesOptions } from "#core/schemas/devices-options.schema";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/peripherals (the configuration with its shipped schema, the
 *          memory drivers gen's wiring imports, and the print bridge's refusal) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The ports are exported from `./contracts` only (ADR 0294
 *           decision 15). The option shape, the driver names, the ESC/POS encoders and the refusal builder stay
 *           internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PeripheralsConfig } from "#config/peripherals.config";
export { PERIPHERALS_CONFIG_SCHEMA as PeripheralsConfig$ } from "#core/constants/peripherals-config-schema.constant";
export { MemoryBarcodeScannerDriver } from "#core/drivers/memory-barcode-scanner.driver";
export { MemoryCashDrawerDriver } from "#core/drivers/memory-cash-drawer.driver";
export { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";
export { MemoryScaleDriver } from "#core/drivers/memory-scale.driver";
export { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";

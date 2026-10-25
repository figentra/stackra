/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/peripherals (the configuration with its shipped schema, the
 *          memory drivers gen's wiring imports, the `channel` customer display driver and its display-side listener,
 *          the in-store barcode parser, and the bridges' refusals) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The ports are exported from `./contracts` only (ADR 0294
 *           decision 15). The option shape, the driver names, the ESC/POS and ZPL encoders, the GS1 check digit and
 *           the refusal builder stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PeripheralsConfig } from "#config/peripherals.config";
export { CUSTOMER_DISPLAY_CHANNEL } from "#core/constants/customer-display-channel.constant";
export { PERIPHERALS_CONFIG_SCHEMA as PeripheralsConfig$ } from "#core/constants/peripherals-config-schema.constant";
export { ChannelCustomerDisplayDriver } from "#core/drivers/channel-customer-display.driver";
export { MemoryBarcodeScannerDriver } from "#core/drivers/memory-barcode-scanner.driver";
export { MemoryCardTerminalDriver } from "#core/drivers/memory-card-terminal.driver";
export { MemoryCashDrawerDriver } from "#core/drivers/memory-cash-drawer.driver";
export { MemoryCustomerDisplayDriver } from "#core/drivers/memory-customer-display.driver";
export { MemoryLabelPrinterDriver } from "#core/drivers/memory-label-printer.driver";
export { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";
export { MemoryScaleDriver } from "#core/drivers/memory-scale.driver";
export { EmbeddedValue } from "#core/enums/embedded-value.enum";
export { LabelPrinterUnavailableError } from "#core/errors/label-printer-unavailable.error";
export { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";
export { listenCustomerDisplay } from "#core/functions/listen-customer-display.function";
export { parseEmbeddedBarcode } from "#core/functions/parse-embedded-barcode.function";
export type { EmbeddedBarcode } from "#core/types/embedded-barcode.type";
export type { EmbeddedBarcodeLayout } from "#core/types/embedded-barcode-layout.type";

/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/peripherals (the configuration with its shipped schema, the
 *          memory drivers gen's wiring imports, the `channel` customer display driver (the `external` one is
 *          @stackra/native-customer-display's, ADR 0478 decision 5) and the display-side listener, the in-store and GS1 barcode parsers, the scale preset fit, the receipt-token
 *          signing and checking with the exit gate, and the bridges' refusals) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The ports are exported from `./contracts` only (ADR 0294
 *           decision 15). The option shape, the driver names, the ESC/POS and ZPL encoders, the GS1 check digit, the
 *           GS1 identifier table, the implied decimal and the refusal builder stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; STA-965.
 */
export { PeripheralsConfig } from "#config/peripherals.config";
export { CUSTOMER_DISPLAY_CHANNEL } from "#core/constants/customer-display-channel.constant";
export { PERIPHERALS_CONFIG_SCHEMA as PeripheralsConfig$ } from "#core/constants/peripherals-config-schema.constant";
export { ChannelCustomerDisplayDriver } from "#core/drivers/channel-customer-display.driver";
export { MemoryAccessControllerDriver } from "#core/drivers/memory-access-controller.driver";
export { MemoryBaggingScaleDriver } from "#core/drivers/memory-bagging-scale.driver";
export { MemoryBarcodeScannerDriver } from "#core/drivers/memory-barcode-scanner.driver";
export { MemoryBumpBarDriver } from "#core/drivers/memory-bump-bar.driver";
export { MemoryCardTerminalDriver } from "#core/drivers/memory-card-terminal.driver";
export { MemoryCashDrawerDriver } from "#core/drivers/memory-cash-drawer.driver";
export { MemoryCustomerDisplayDriver } from "#core/drivers/memory-customer-display.driver";
export { MemoryDriveThroughLaneDriver } from "#core/drivers/memory-drive-through-lane.driver";
export { MemoryKitchenPrinterDriver } from "#core/drivers/memory-kitchen-printer.driver";
export { MemoryLabelPrinterDriver } from "#core/drivers/memory-label-printer.driver";
export { MemoryLabelScaleDriver } from "#core/drivers/memory-label-scale.driver";
export { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";
export { MemoryScaleDriver } from "#core/drivers/memory-scale.driver";
export { MemoryScannerScaleDriver } from "#core/drivers/memory-scanner-scale.driver";
export { MemoryUsedReceiptStoreDriver } from "#core/drivers/memory-used-receipt-store.driver";
export { PrinterKickCashDrawerDriver } from "#core/drivers/printer-kick-cash-drawer.driver";
export { EmbeddedValue } from "#core/enums/embedded-value.enum";
export { LabelPrinterUnavailableError } from "#core/errors/label-printer-unavailable.error";
export { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";
export { fitScaleReading } from "#core/functions/fit-scale-reading.function";
export { importReceiptPublicKey } from "#core/functions/import-receipt-public-key.function";
export { listenCustomerDisplay } from "#core/functions/listen-customer-display.function";
export { parseEmbeddedBarcode } from "#core/functions/parse-embedded-barcode.function";
export { parseGs1ElementString } from "#core/functions/parse-gs1-element-string.function";
export { signReceiptToken } from "#core/functions/sign-receipt-token.function";
export { verifyReceiptToken } from "#core/functions/verify-receipt-token.function";
export { ExitGateService } from "#core/services/exit-gate.service";
export type { EmbeddedBarcode } from "#core/types/embedded-barcode.type";
export type { EmbeddedBarcodeLayout } from "#core/types/embedded-barcode-layout.type";
export type { Gs1ElementString } from "#core/types/gs1-element-string.type";
export type { ExitGateOptions } from "#core/types/exit-gate-options.type";

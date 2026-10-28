/**
 * Stackra file contract:
 * Purpose: `ReceiptPrinterPluginProps`, the options of the package's config plugin: the vendor families the app's
 *          runway lists (`device:<family>`), where Android fetches the vendor artefacts that are not on Maven Central,
 *          where iOS finds Epson's framework, and the local network purpose string the app translates.
 * Boundary: a type only; gen writes the plugin entry from the runway (ADR 0442 decision 3), so an app never lists a
 *           vendor by hand. Repository URLs and paths point at the vendor's own distribution; this package holds no
 *           vendor binary (ADR 0478 decision 4). No secret goes here: a vendor repository's credentials stay in the
 *           build machine's Gradle settings.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 4); ADR 0442 (decision 3).
 */
import type { ReceiptPrinterVendorName } from "#plugin/types/receipt-printer-vendor-name.type";
import type { VendorArtifact } from "#plugin/types/vendor-artifact.type";

/** The config plugin's options. */
export interface ReceiptPrinterPluginProps {
  /** The families to link; every other family's code and SDK are left out of the build. Empty links none. */
  readonly vendors?: readonly ReceiptPrinterVendorName[];
  /** Android: each linked vendor's artefact (Epson and PAX have no default and need one). */
  readonly android?: Readonly<Partial<Record<ReceiptPrinterVendorName, VendorArtifact>>>;
  /** iOS: the path of Epson's `libepos2.xcframework` fetched from Epson's portal, and the StarIO10 pod version. */
  readonly ios?: { readonly epsonFramework?: string; readonly starVersion?: string };
  /** iOS: `NSLocalNetworkUsageDescription`, already translated by the app; left as it is when not given. */
  readonly localNetworkUsage?: string;
}

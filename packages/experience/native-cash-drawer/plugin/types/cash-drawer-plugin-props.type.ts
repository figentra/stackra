/**
 * Stackra file contract:
 * Purpose: `CashDrawerPluginProps`, the options of the package's config plugin: the drawer port families the app's
 *          runway lists (`device:<family>`) and where Android fetches the vendor artefacts that are not on Maven Central.
 * Boundary: a type only; gen writes the plugin entry from the runway (ADR 0442 decision 3). Repository URLs point at
 *           the vendor's own distribution; this package holds no vendor binary (ADR 0478 decision 4) and no secret.
 *           iOS has no drawer port family, so there is no iOS option.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 4); ADR 0442 (decision 3).
 */
import type { CashDrawerVendorName } from "#plugin/types/cash-drawer-vendor-name.type";
import type { VendorArtifact } from "#plugin/types/vendor-artifact.type";

/** The config plugin's options. */
export interface CashDrawerPluginProps {
  /** The families to link; every other family's code and SDK are left out of the build. Empty links none. */
  readonly vendors?: readonly CashDrawerVendorName[];
  /** Android: each linked vendor's artefact (PAX has no default and needs one). */
  readonly android?: Readonly<Partial<Record<CashDrawerVendorName, VendorArtifact>>>;
}

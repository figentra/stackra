/**
 * Stackra file contract:
 * Purpose: `StudioExportProps`: props of `StudioExport`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Theme } from "@stackra/tokens/contracts";

/** Props of {@link StudioExport}. */
export interface StudioExportProps {
  /** The theme the changes-only export is measured against and the import applies a diff to. */
  base: Theme;
  /** The theme to export. */
  theme: Theme;
  /** Called with a checked imported theme. */
  onImport: (theme: Theme) => void;
}

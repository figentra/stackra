/**
 * Stackra file contract:
 * Purpose: `StudioTopBarProps`: props of `StudioTopBar`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { StudioView } from "#src/components/studio-preview";
import type { BrandTheme } from "#src/constants/brand-themes";

/** Props of {@link StudioTopBar}. */
export interface StudioTopBarProps {
  /** The brand the studio starts from, named under the title (the rail's Brand section picks it). */
  brand: BrandTheme;
  /** How the canvas is drawn: device, orientation, zoom, side by side. */
  view: StudioView;
  /** Called with the view picked. */
  onViewChange: (view: StudioView) => void;
  /** The canvas's scheme as picked; null follows the page's. */
  schemeChoice: "light" | "dark" | null;
  /** Called with the scheme picked; null follows the page's. */
  onSchemeChange: (scheme: "light" | "dark" | null) => void;
  /** The reading direction (the locale: English or Arabic). */
  direction: "ltr" | "rtl";
  /** Called with the direction picked. */
  onDirectionChange: (direction: "ltr" | "rtl") => void;
  /** True when there is a change to undo. */
  canUndo: boolean;
  /** True when there is a change to redo. */
  canRedo: boolean;
  /** Undoes the last change. */
  onUndo: () => void;
  /** Redoes the last change undone. */
  onRedo: () => void;
  /** Returns to the brand's theme. */
  onReset: () => void;
  /** Copies a link to this theme. */
  onCopyLink: () => void;
  /** True while the inspector is shown. */
  isInspectorOpen: boolean;
  /** Shows or hides the inspector. */
  onInspectorToggle: () => void;
  /** Opens the export. */
  onExport: () => void;
  /** Leaves the studio. */
  onExit: () => void;
}

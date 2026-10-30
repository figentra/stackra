/**
 * Stackra file contract:
 * Purpose: `StudioDisplaySettingsProps`: props of `StudioDisplaySettings`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { StudioTopBarProps } from "./studio-top-bar.props";

/** Props of {@link StudioDisplaySettings}: the top bar's view, scheme, direction, reset and copy link. */
export type StudioDisplaySettingsProps = Pick<
  StudioTopBarProps,
  | "view"
  | "onViewChange"
  | "schemeChoice"
  | "onSchemeChange"
  | "direction"
  | "onDirectionChange"
  | "onReset"
  | "onCopyLink"
>;

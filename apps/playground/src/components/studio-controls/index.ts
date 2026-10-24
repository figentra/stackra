/**
 * Stackra file contract:
 * Purpose: public surface of the studio-controls component folder: the component, its Props, the presets and faces.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export {
  STUDIO_FACES,
  STUDIO_PRESETS,
  StudioControls,
  type StudioControlsProps,
} from "./studio-controls";

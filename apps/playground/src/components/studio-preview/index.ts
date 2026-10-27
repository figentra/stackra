/**
 * Stackra file contract:
 * Purpose: public surface of the studio-preview component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { StudioPreview } from "./studio-preview";
export { type StudioPreviewProps } from "./studio-preview.props";

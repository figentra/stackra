/**
 * Stackra file contract:
 * Purpose: public surface of the glass component folder: the component and its Props only.
 * Boundary: re-exports only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14).
 */
export { Glass, type GlassProps } from "./glass";

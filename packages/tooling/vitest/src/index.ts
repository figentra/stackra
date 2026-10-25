/**
 * Stackra file contract:
 * Purpose: the package's `.` entry: the base preset and the role vocabulary (libraryPreset, servicePreset,
 *          appPreset, mobilePreset, toolingPreset) in one import.
 * Boundary: re-exports only. Kept apart from preset.ts so factories.ts can import the presets without a
 *           module cycle.
 * Runtime: node
 * Governing contract: Stackra ADR 0007 (documentation)
 */
export { stackraVitest } from "./preset.ts";
export * from "./factories.ts";

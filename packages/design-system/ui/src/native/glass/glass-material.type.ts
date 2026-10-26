/**
 * Stackra file contract:
 * Purpose: `GlassMaterial`: the modes a native control can draw.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0319 (decision 3); ADR 0320 (decision
 *          7, the material modes and their fallbacks).
 */
import type { MaterialMode } from "@stackra/tokens/contracts";

/** The modes a native control can draw: Liquid Glass or the opaque surface. */
export type GlassMaterial = Extract<MaterialMode, "liquid" | "solid">;

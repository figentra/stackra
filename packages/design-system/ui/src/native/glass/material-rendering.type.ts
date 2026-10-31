/**
 * Stackra file contract:
 * Purpose: `MaterialRendering`: how a native material role is drawn: Liquid Glass (`liquid-regular` for the
 *          functional layer, `liquid-clear` over media), a real backdrop blur (`blur`: expo-blur, the front family
 *          only, iOS before 26 and Android 12+), or the opaque tonal surface (`solid`).
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7 as amended 2026-10-31); ADR 0305 (one declaration per file).
 */

/** How a native material role is drawn. */
export type MaterialRendering = "liquid-regular" | "liquid-clear" | "blur" | "solid";

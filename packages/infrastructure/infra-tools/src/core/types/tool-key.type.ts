/**
 * Stackra file contract:
 * Purpose: `ToolKey`, the key of a self-hosted tool in `TOOLS_CATALOGUE` (`documenso`, `nominatim`).
 * Boundary: type only; derived from the catalogue, so a new catalogue entry is a new key.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-5 (2026-10-26); ADR 0444.
 */
import type { TOOLS_CATALOGUE } from "#core/constants/tools-catalogue.constant";

/** The key of one tool in the catalogue. */
export type ToolKey = keyof typeof TOOLS_CATALOGUE;

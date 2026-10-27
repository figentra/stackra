/**
 * Stackra file contract:
 * Purpose: `LibraryPresetOptions`, the options type of `libraryPreset` (STA-339).
 * Boundary: a type only; the same type as `LibraryOptions`.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import type { LibraryOptions } from "./library-options.type.ts";

/** The options type of `libraryPreset`; the same type as {@link LibraryOptions}. */
export type LibraryPresetOptions = LibraryOptions;

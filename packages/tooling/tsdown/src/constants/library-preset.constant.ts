/**
 * Stackra file contract:
 * Purpose: `libraryPreset`, the role-vocabulary name of `library()`, which generated `.stackra/tsdown.config.ts` files
 *          import (STA-339).
 * Boundary: the same function, under a second name.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { library } from "../functions/library.function.ts";

/** The role-vocabulary name of {@link library}, which generated `.stackra/tsdown.config.ts` files import. */
export const libraryPreset = library;

/**
 * Stackra file contract:
 * Purpose: `DEV_SURFACE_FILES`, where a surface's dev files live under the product root: the folder gen's bundle mode
 *          writes per surface, the Vite config inside it, and the descriptor `stackra dev --surface` writes beside it.
 * Boundary: data only. The folder and Vite config names are the contract with gen's bundle mode (stackra-04); if gen
 *           lands another path, this file changes and nothing else.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tool configs live in `.stackra/`); ADR 0436 (decision 6).
 */

/** The dev file paths of one surface, relative to the product root. */
export const DEV_SURFACE_FILES = {
  /** The surface's folder (`.stackra/surfaces/<surface>`). */
  dir: (surface: string): string => `.stackra/surfaces/${surface}`,

  /** The Vite config gen's bundle mode writes for the surface. */
  viteConfig: (surface: string): string => `.stackra/surfaces/${surface}/vite.config.ts`,

  /** The `DevSurface` descriptor the dev command writes. */
  descriptor: (surface: string): string => `.stackra/surfaces/${surface}/dev-surface.json`,
} as const;

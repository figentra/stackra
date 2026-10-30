/**
 * Stackra file contract:
 * Purpose: `ApiDoc`, the generated API of one entry on one platform (`api/<platform>/<tier>/<slug>.json`).
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.1; ADR 0305 (one declaration per file).
 */
import type { Platform } from "#src/enums/platform.enum";
import type { ApiHook } from "#src/types/api-hook.type";
import type { ApiPart } from "#src/types/api-part.type";
import type { ApiSlot } from "#src/types/api-slot.type";

/** The generated API of one entry on one platform. */
export interface ApiDoc {
  /** The entry key, "free/button". */
  readonly key: string;
  /** The platform the API was generated for. */
  readonly platform: Platform;
  /** The line that imports the entry. */
  readonly importLine: string;
  /** The sources the API was generated from and their hash. */
  readonly generatedFrom: {
    readonly propsFiles: readonly string[];
    readonly heroDoc?: string;
    readonly hash: string;
  };
  /** In the registry's `parts` order. */
  readonly parts: readonly ApiPart[];
  /** Hooks: HeroUI native hooks our entry re-exports, and our own hooks typed by a `*.returns.ts`. */
  readonly hooks?: readonly ApiHook[];
  /** React CSS classes or native `classNames` keys. */
  readonly slots?: readonly ApiSlot[];
}

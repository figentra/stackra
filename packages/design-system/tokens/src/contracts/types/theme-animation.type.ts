/**
 * Stackra file contract:
 * Purpose: `ThemeAnimation`, part of the token schema of the Stackra Design System (see `Theme`): the motion family
 *          beside the duration steps: the named easings, the spring presets, the press scale and the distance an
 *          entrance travels.
 * Boundary: a type only. Easing and spring names are kebab-case and become CSS custom property names as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */
import type { SpringToken } from "#contracts/types/spring-token.type";

/** The easings, springs and gesture constants of a theme's motion. */
export interface ThemeAnimation {
  /**
   * The named easings (`standard`, `emphasized`, `enter`, `exit`), each a CSS named easing or a `cubic-bezier()`, so
   * an animation library plays it as CSS does; rendered as `--ease-<name>`.
   */
  readonly easings: Readonly<Record<string, string>>;
  /** The spring presets (`gentle`, `snappy`, `bouncy`), rendered as `--spring-<name>` and `--spring-<name>-duration`. */
  readonly springs: Readonly<Record<string, SpringToken>>;
  /** The scale a pressed control shrinks to, from 0.8 to 1; `--press-scale`. */
  readonly pressScale: number;
  /** How far an entrance rises into place, a px length; `--enter-distance`. */
  readonly enterDistance: string;
}

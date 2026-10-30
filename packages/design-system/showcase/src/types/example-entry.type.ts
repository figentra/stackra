/**
 * Stackra file contract:
 * Purpose: `ExampleEntry`, one example of an entry: the id names the demo file (`demos/<tier>/<slug>/<id>.tsx`) on each platform.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0305 (one declaration per file).
 */
import type { Platform } from "#src/enums/platform.enum";
import type { Knob } from "#src/types/knob.type";

/** One example of a component entry. */
export interface ExampleEntry {
  /** The demo file name, kebab-case ("variants", "with-icons"); the title is `showcase::example.<tier>.<slug>.<id>.title`. */
  readonly id: string;
  /** The platforms that have this example; default: the entry's platforms. */
  readonly platforms?: readonly Platform[];
  /** The preview pane height; default 350 on web and 240 on native. */
  readonly minHeight?: number;
  /** Exactly one example per built entry: the live mini preview on its card. */
  readonly card?: true;
  /** The knobs playground (WP11); default derived from the ApiDoc. */
  readonly knobs?: readonly Knob[];
}

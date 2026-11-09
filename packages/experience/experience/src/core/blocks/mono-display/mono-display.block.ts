/**
 * Stackra file contract:
 * Purpose: `MonoDisplayBlock`, the document side of the landing's closing wordmark (`./react`'s `MonoDisplay`):
 *          the wordmark drawn in code glyphs, its tagline and its art.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The wordmark is a name, never translated. The key is gen's
 *           `<member>.<snake(folder)>`, `experience.mono_display`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { MonoDisplayArt } from "#core/enums/mono-display-art.enum";

/** The mono display a document places. */
export class MonoDisplayBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.monoDisplay,
}) {
  /** The wordmark drawn in code glyphs, never translated. */
  title!: string;

  /** The line under the wordmark. */
  tagline?: LocalizedText;

  /** The art the wordmark stands on. */
  art?: MonoDisplayArt;

  /** The glyph field's poster, a root-relative URL; the `glyphs` art draws only with one. */
  poster?: string;
}

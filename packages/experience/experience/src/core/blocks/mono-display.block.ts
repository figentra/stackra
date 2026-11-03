/**
 * Stackra file contract:
 * Purpose: `MonoDisplayBlock`, the document side of the landing's closing wordmark (`./react`'s `MonoDisplayBlock`):
 *          the wordmark drawn in code glyphs, its tagline and its art.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The wordmark is a name, never translated. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The mono display a document places. */
export class MonoDisplayBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.monoDisplay,
}) {
  title!: string;

  tagline?: LocalizedText;

  art?: "floors" | "glyphs" | "none";
}

/**
 * Stackra file contract:
 * Purpose: `EditorOptions`, what `Editor.create` opens: the document's root node as experience stores it, the
 *          registered blocks its tree is checked against, and optionally the document's kind and a reviewed block kit
 *          that narrow the palette.
 * Boundary: a type only, in the leaf entry. The root is one experience `DocumentNode` (a document stored as a list of
 *           nodes is opened by its owner under one root block). The palette is code (ADR 0270 decision 3): `blocks`
 *           maps each registered block key to its block class, whose schema `@stackra/validation` holds, and is what
 *           `@stackra/experience`'s `registeredBlocks()` returns; an editor never invents a block.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 1, 3 and 4); ADR 0109 (registry manifests); ADR 0110 (L2 documents); ADR 0270 (decision 6: document kinds); COM-358.
 */
import type { AnyClass } from "@stackra/container";
import type { DocumentNode, ExperienceKind } from "@stackra/experience/contracts";

import type { BlockKit } from "#contracts/types/block-kit.type";

/**
 * How an editor is opened.
 *
 * @example
 * const editor = Editor.create({ root: page.root, blocks: registeredBlocks() });
 */
export interface EditorOptions {
  /** The document's root node, as stored; ids are kept, and derived from position where a node has none. */
  readonly root: DocumentNode;

  /**
   * Every registered block class by key (`web.hero_section`), which the palette and the check use; pass
   * `registeredBlocks()`.
   */
  readonly blocks: ReadonlyMap<string, AnyClass>;

  /**
   * The document's kind (`ExperienceKind.EmailTemplate`): the palette offers, and `insert` accepts, only blocks that
   * fit it; every registered block when absent.
   */
  readonly kind?: ExperienceKind;

  /** A reviewed block kit: the palette offers, and `insert` accepts, only its blocks; no limit when absent. */
  readonly kit?: BlockKit;
}

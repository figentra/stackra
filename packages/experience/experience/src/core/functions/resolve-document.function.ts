/**
 * Stackra file contract:
 * Purpose: `resolveDocument`, the document validator every renderer runs first: it reads a document (one node or a
 *          list), resolves each node's key to the block registered on this target, parses its props with the block's
 *          generated schema, reads every `LocalizedText` in the locale, and returns the checked tree to draw.
 * Boundary: all or nothing: the first malformed node, unknown key or refused props throws, so a renderer never draws a
 *           partial page. `null` and `undefined` are an empty document. The schema comes from `@stackra/validation`'s
 *           registry (gen registers one per block), never compiled at runtime. The accepted query's input is passed on
 *           as given; the client checks it against the query's schema when it fetches.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decisions 1, 2, 4 and 6); ADR 0112 (X5: the validator is in this package); ADR 0294
 *                     (decision 26).
 */
import type { QueryRef } from "@stackra/clients";
import { kindOf } from "@stackra/container";
import type { Json } from "@stackra/contracts";
import { schemaOf } from "@stackra/validation";

import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { InvalidDocumentError } from "#core/errors/invalid-document.error";
import { UnknownBlockError } from "#core/errors/unknown-block.error";
import { localizeValue } from "#core/functions/localize-value.function";
import type { ResolvedNode } from "#core/types/resolved-node.type";

/** True for a plain JSON object. */
const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Checks and resolves the node at `path`, then its children. */
function resolveNode(value: unknown, path: string, locale: string): ResolvedNode {
  if (!isObject(value)) throw InvalidDocumentError.create({ path });
  const { block, props = {}, input = {}, children = [] } = value;
  if (typeof block !== "string") throw InvalidDocumentError.create({ path });
  if (!isObject(props) || !Array.isArray(children))
    throw InvalidDocumentError.create({ path, block });
  const entry = BLOCK_ENTRIES.get(block);
  if (entry === undefined) throw UnknownBlockError.create({ block, path });
  const schema = schemaOf(entry.block);
  const parsed = schema.safeParse(props);
  if (!parsed.success) throw InvalidDocumentError.create({ path, block }, { cause: parsed.error });
  return {
    path,
    entry,
    props: localizeValue(schema, parsed.data, locale) as Readonly<Record<string, unknown>>,
    accepts: (kindOf(entry.block)?.options["accepts"] as QueryRef | null | undefined) ?? null,
    input: input as Json,
    children: children.map((child: unknown, index: number) =>
      resolveNode(child, `${path}.children.${index}`, locale),
    ),
  };
}

/**
 * The checked tree of `document` for `locale`.
 *
 * @throws InvalidDocumentError when the document is not a node or a list of nodes, or a node's props break its block's
 *         schema.
 * @throws UnknownBlockError when a node names a block nobody registered on this target.
 * @throws TypeError when a registered block has no generated schema (run `stackra gen`).
 * @example
 * const nodes = resolveDocument(page.root, "ar-SA");
 */
export function resolveDocument(document: unknown, locale: string): readonly ResolvedNode[] {
  if (document === null || document === undefined) return [];
  const nodes: readonly unknown[] = Array.isArray(document) ? document : [document];
  return nodes.map((node, index) => resolveNode(node, String(index), locale));
}

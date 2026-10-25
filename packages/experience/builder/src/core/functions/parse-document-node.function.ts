/**
 * Stackra file contract:
 * Purpose: `parseDocumentNode(input)`, the wire form of a document tree: it turns a stored or received root node (the
 *          experience `DocumentNode` format) into a frozen `EditorNode` tree, or refuses it with every malformed node
 *          and field by path.
 * Boundary: a pure function and the trust boundary for document structure: at most `MAX_DOCUMENT_BLOCKS` blocks and
 *           `MAX_DOCUMENT_DEPTH` levels, each node a plain object with a block key, plain-object props (`{}` when
 *           absent), a children array (`[]` when absent) and, when given, a unique id (`BLOCK_KEY_PATTERN`,
 *           `BLOCK_ID_PATTERN`). A node without an id gets
 *           `b<n>`, its depth-first position, so every editor that parses the same document derives the same ids. The
 *           query `input` is kept as given; other keys are dropped. Props are copied one level deep with own properties
 *           only, so a `__proto__` key stays data. Whether a block is registered and its props fit is
 *           `Editor.problems`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 1: one format, one validator); ADR 0110 (the node format); ADR 0154 (data
 *                     that names registered code); ADR 0328 (decision 6: `parse` is the wire form); ADR 0140 (field
 *                     errors by path).
 */
import type { Json } from "@stackra/contracts";

import type { EditorNode } from "#contracts/index";
import { BLOCK_ID_PATTERN } from "#core/constants/block-id-pattern.constant";
import { BLOCK_KEY_PATTERN } from "#core/constants/block-key-pattern.constant";
import { MAX_DOCUMENT_BLOCKS } from "#core/constants/max-document-blocks.constant";
import { MAX_DOCUMENT_DEPTH } from "#core/constants/max-document-depth.constant";
import { DocumentInvalidError } from "#core/errors/document-invalid.error";

/** True for a non-null, non-array object. */
function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `path` and `key` joined with a dot; `key` alone at the root. */
function join(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

/**
 * `input` as a document tree.
 *
 * @throws DocumentInvalidError with one field error per refused node or field (codes in its file contract).
 * @example
 * const root = parseDocumentNode(JSON.parse(body)); // frozen; every node has a unique id
 */
export function parseDocumentNode(input: unknown): EditorNode {
  const errors: Record<string, string> = {};
  const ids = new Set<string>();
  let count = 0;
  const visit = (value: unknown, path: string, depth: number): EditorNode | undefined => {
    const at = path === "" ? "(root)" : path;
    count += 1;
    if (count > MAX_DOCUMENT_BLOCKS) {
      errors["(root)"] = "too_many_blocks";
      return undefined;
    }
    if (depth > MAX_DOCUMENT_DEPTH) {
      errors[at] = "too_deep";
      return undefined;
    }
    if (!isObject(value)) {
      errors[at] = "node_invalid";
      return undefined;
    }
    const { id = `b${count - 1}`, block, props = {}, children = [], input: query } = value;
    if (typeof id !== "string" || !BLOCK_ID_PATTERN.test(id))
      errors[join(path, "id")] = "id_invalid";
    else if (ids.has(id)) errors[join(path, "id")] = "id_taken";
    else ids.add(id);
    if (typeof block !== "string" || !BLOCK_KEY_PATTERN.test(block))
      errors[join(path, "block")] = "block_invalid";
    if (!isObject(props)) errors[join(path, "props")] = "props_invalid";
    if (!Array.isArray(children)) errors[join(path, "children")] = "children_invalid";
    const nested = Array.isArray(children)
      ? (children as readonly unknown[]).map((child, index) =>
          visit(child, join(path, `children.${index}`), depth + 1),
        )
      : [];
    if (typeof id !== "string" || typeof block !== "string" || !isObject(props)) return undefined;
    return Object.freeze({
      id,
      block,
      // reason: a stored or received document is JSON, so every prop value is a JSON value
      props: Object.freeze(Object.fromEntries(Object.entries(props))) as Readonly<
        Record<string, Json>
      >,
      children: Object.freeze(nested.filter((child): child is EditorNode => child !== undefined)),
      // reason: as above, the query input of a stored node is JSON
      ...(query === undefined ? {} : { input: query as Json }),
    });
  };
  const root = visit(input, "", 1);
  if (root === undefined || Object.keys(errors).length > 0)
    throw DocumentInvalidError.create({}, { fieldErrors: errors });
  return root;
}

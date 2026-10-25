/**
 * Stackra file contract:
 * Purpose: `validateDocument(document, options)`, the server-side document validator: every problem of a stored or
 *          received document against its kind and the registered blocks, before it is saved or published. A node must
 *          be a node with only the five known keys, name a known block that fits the kind, give props its schema
 *          accepts and an id no other node has; the tree must keep to the depth and size bounds.
 * Boundary: pure; never throws on the document, which is untrusted: it returns every problem, path by path, in tree
 *           order (`[]` when the document is valid; `null` and `undefined` are an empty document). It needs no
 *           component, so it runs on a server. Prop values are never echoed, only their paths. A registered block with
 *           no generated schema throws `@stackra/validation`'s TypeError: that is a build fault, not a document one.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decisions 1, 4 and 6); ADR 0270 (decisions 1 and 6); ADR 0154.
 */
import { schemaOf } from "@stackra/validation";

import type { DocumentProblem } from "#contracts/types/document-problem.type";
import { DOCUMENT_LIMITS } from "#core/constants/document-limits.constant";
import { blockKinds } from "#core/functions/block-kinds.function";
import type { ValidateDocumentOptions } from "#core/types/validate-document-options.type";

/** The keys a stored node may carry. */
const NODE_KEYS = new Set(["id", "block", "props", "input", "children"]);

/** A plain JSON object. */
const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Every problem of `document`.
 *
 * @example
 * const problems = validateDocument(body.root, { kind: ExperienceKind.EmailTemplate, blocks });
 * if (problems.length > 0) return refuse(problems);
 */
export function validateDocument(
  document: unknown,
  options: ValidateDocumentOptions,
): DocumentProblem[] {
  const { kind, blocks } = options;
  const maxDepth = options.maxDepth ?? DOCUMENT_LIMITS.maxDepth;
  const maxBlocks = options.maxBlocks ?? DOCUMENT_LIMITS.maxBlocks;
  const problems: DocumentProblem[] = [];
  const ids = new Set<string>();
  let count = 0;

  const visit = (value: unknown, path: string, depth: number): void => {
    if (count > maxBlocks) return;
    count += 1;
    if (count > maxBlocks) {
      problems.push({ path: "", code: "too_many_blocks" });
      return;
    }
    if (depth > maxDepth) {
      problems.push({ path, code: "too_deep" });
      return;
    }
    if (!isObject(value) || typeof value["block"] !== "string") {
      problems.push({ path, code: "invalid_node" });
      return;
    }
    const block = value["block"];
    const { id, props = {}, children = [] } = value;
    if (
      Object.keys(value).some((key) => !NODE_KEYS.has(key)) ||
      (id !== undefined && typeof id !== "string") ||
      !isObject(props) ||
      !Array.isArray(children)
    ) {
      problems.push({ path, code: "invalid_node", block });
      return;
    }
    if (typeof id === "string") {
      if (ids.has(id)) problems.push({ path, code: "duplicate_id", block });
      ids.add(id);
    }
    const type = blocks.get(block);
    if (type === undefined) problems.push({ path, code: "unknown_block", block });
    else {
      if (!blockKinds(type).includes(kind))
        problems.push({ path, code: "kind_not_allowed", block });
      const parsed = schemaOf(type).safeParse(props);
      if (!parsed.success)
        problems.push({
          path,
          code: "invalid_props",
          block,
          props: parsed.error.issues.map((issue) => issue.path.join(".")),
        });
    }
    children.forEach((child: unknown, index: number) =>
      visit(child, `${path}.children.${index}`, depth + 1),
    );
  };

  if (document === null || document === undefined) return problems;
  (Array.isArray(document) ? document : [document]).forEach((node: unknown, index: number) =>
    visit(node, String(index), 1),
  );
  return problems;
}

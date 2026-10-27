/**
 * Stackra file contract:
 * Purpose: `renderEdgeDocument`, the edge render of a cached, published experience document: each node an
 *          OS-registered edge block draws becomes its HTML; any other node (a product's own block, or a block whose
 *          data comes from a query) becomes a placeholder the shell hydrates in the browser.
 * Boundary: synchronous, no Node API, no fetch, no React: it runs in the OS edge Worker. It never throws: a malformed
 *           document, refused props, a throwing block or an overrun of the render budget returns `ok: false` with
 *           the reason and the document revision, and the Worker serves the shell instead (ADR 0440, review point 6).
 *           All or nothing, so a crawler never gets half a page. A placeholder carries the stored node as escaped
 *           JSON in an attribute; nothing in a document is evaluated (ADR 0110 decision 4).
 * Runtime: worker
 * Governing contract: ADR 0440; ADR 0437 (the edge Worker); ADR 0297 (decision 3); ADR 0110 (decisions 4 and 6);
 *                     app-shells-edge-and-extension.md sections 5.1 step 6, 10 and 16 (points 1 and 6).
 */
import { kindOf } from "@stackra/container";
import { Renamed, schemaOf } from "@stackra/validation";
import { escapeHtml } from "@stackra/support";

import { localizeValue } from "#core/functions/localize-value.function";
import { EDGE_RENDER_LIMITS } from "#edge/constants/edge-render-limits.constant";
import { EdgeRenderFailure } from "#edge/enums/edge-render-failure.enum";
import type { EdgeBlock } from "#edge/types/edge-block.type";
import type { EdgeRenderOptions } from "#edge/types/edge-render-options.type";
import type { EdgeRenderResult } from "#edge/types/edge-render-result.type";

/** True for a plain JSON object. */
const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The reason a render stopped, thrown inside the walk and turned into a result at the top. */
class EdgeStop {
  readonly reason: EdgeRenderFailure;

  readonly path: string;

  constructor(reason: EdgeRenderFailure, path: string) {
    this.reason = reason;
    this.path = path;
  }
}

/** Each edge block by its key and by its `@Renamed` old key. */
function byKey(blocks: readonly EdgeBlock[]): ReadonlyMap<string, EdgeBlock> {
  const map = new Map<string, EdgeBlock>();
  for (const entry of blocks) {
    map.set(entry.key, entry);
    const old = Renamed.on(entry.block);
    if (old !== undefined && !map.has(old)) map.set(old, entry);
  }
  return map;
}

/** The element the shell finds by `data-stackra-block` and hydrates with the stored node. */
const placeholder = (node: Readonly<Record<string, unknown>>, block: string, path: string) =>
  `<div data-stackra-block="${escapeHtml(block)}" data-stackra-path="${escapeHtml(path)}" ` +
  `data-stackra-node="${escapeHtml(JSON.stringify(node))}"></div>`;

/**
 * The HTML of `document`, or why the Worker serves the shell instead.
 *
 * @example
 * const result = renderEdgeDocument(cached.root, { locale: "ar-SA", revision: cached.revision, blocks: LANDING_BLOCKS });
 * if (!result.ok) {
 *   log.warn("edge render fell back to the shell", { revision: result.revision, reason: result.reason, path: result.path });
 *   return serveShell(request);
 * }
 */
export function renderEdgeDocument(
  document: unknown,
  options: EdgeRenderOptions,
): EdgeRenderResult {
  const { locale, revision } = options;
  const limits = { ...EDGE_RENDER_LIMITS, ...options.limits };
  const blocks = byKey(options.blocks);
  let count = 0;

  /** Throws when `html` alone is over the byte budget; a node's HTML holds its subtree's. */
  const take = (html: string, path: string): string => {
    if (html.length > limits.maxBytes) throw new EdgeStop(EdgeRenderFailure.OverBudget, path);
    return html;
  };

  const render = (value: unknown, path: string, depth: number): string => {
    count += 1;
    if (depth > limits.maxDepth || count > limits.maxNodes)
      throw new EdgeStop(EdgeRenderFailure.OverBudget, path);
    if (!isObject(value) || typeof value["block"] !== "string")
      throw new EdgeStop(EdgeRenderFailure.InvalidDocument, path);
    const {
      block,
      props = {},
      children = [],
    } = value as {
      block: string;
      props?: unknown;
      children?: unknown;
    };
    if (!isObject(props) || !Array.isArray(children))
      throw new EdgeStop(EdgeRenderFailure.InvalidDocument, path);
    const entry = blocks.get(block);
    // A product's block, or one that needs its query's data, renders in the browser only (review point 1).
    if (entry === undefined || kindOf(entry.block)?.options["accepts"])
      return take(placeholder(value, block, path), path);
    let schema;
    try {
      schema = schemaOf(entry.block);
    } catch {
      throw new EdgeStop(EdgeRenderFailure.BlockFailed, path);
    }
    const parsed = schema.safeParse(props);
    if (!parsed.success) throw new EdgeStop(EdgeRenderFailure.InvalidDocument, path);
    const inner = children
      .map((child: unknown, index: number) => render(child, `${path}.children.${index}`, depth + 1))
      .join("");
    const localized = localizeValue(schema, parsed.data, locale) as Readonly<
      Record<string, unknown>
    >;
    let html: string;
    try {
      html = entry.html(localized, inner, { locale, path });
    } catch {
      throw new EdgeStop(EdgeRenderFailure.BlockFailed, path);
    }
    return take(html, path);
  };

  try {
    if (document === null || document === undefined) return { ok: true, html: "", revision };
    const nodes: readonly unknown[] = Array.isArray(document) ? document : [document];
    const html = take(nodes.map((node, index) => render(node, String(index), 1)).join(""), "");
    return { ok: true, html, revision };
  } catch (error) {
    if (error instanceof EdgeStop)
      return { ok: false, reason: error.reason, revision, path: error.path };
    // A stack overflow or anything else unexpected still falls back to the shell.
    return { ok: false, reason: EdgeRenderFailure.BlockFailed, revision };
  }
}

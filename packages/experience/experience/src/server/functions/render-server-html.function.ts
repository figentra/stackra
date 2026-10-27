/**
 * Stackra file contract:
 * Purpose: `renderServerHtml`, the node renderer: a stored studio document of one kind (an email template, a print
 *          document) as one self-contained HTML page, each node drawn by the host's server block for its key.
 * Boundary: synchronous, no fetch, no React. It checks the whole document with `validateDocument` against the kind
 *           first and throws before drawing anything: an unknown key is `UnknownBlockError`, any other problem
 *           (a block outside the kind, refused props, a malformed tree, the size bounds) `InvalidDocumentError`.
 *           Nothing in a document is evaluated; a node's `input` is ignored (the host resolves data into `data`).
 *           The direction comes from the host's locale setting.
 * Runtime: node
 * Governing contract: ADR 0270 (decisions 6 and 7); ADR 0110 (decisions 4 and 6); ADR 0365 (decision 2: inline data).
 */
import { Renamed, schemaOf } from "@stackra/validation";
import { escapeHtml } from "@stackra/support";

import type { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { InvalidDocumentError } from "#core/errors/invalid-document.error";
import { UnknownBlockError } from "#core/errors/unknown-block.error";
import { localizeValue } from "#core/functions/localize-value.function";
import { validateDocument } from "#core/functions/validate-document.function";
import type { BlockClass } from "#core/types/block-class.type";
import type { ServerBlock } from "#server/types/server-block.type";
import type { ServerRenderOptions } from "#server/types/server-render-options.type";

/** A node after `validateDocument` accepted it. */
interface CheckedNode {
  readonly block: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly children?: readonly CheckedNode[];
}

/**
 * The HTML page of `document` as a `kind` document.
 *
 * @example
 * const html = renderServerHtml(stored.root, ExperienceKind.EmailTemplate, { locale: "ar-SA", direction: "rtl", blocks: MAIL_BLOCKS, data: { order } });
 * @throws UnknownBlockError when a node names a key none of `options.blocks` has.
 * @throws InvalidDocumentError when the document breaks its kind, a block's schema or the size bounds.
 */
export function renderServerHtml(
  document: unknown,
  kind: ExperienceKind,
  options: ServerRenderOptions,
): string {
  const { locale, data = {} } = options;
  const entries = new Map<string, ServerBlock>();
  const classes = new Map<string, BlockClass>();
  for (const entry of options.blocks) {
    entries.set(entry.key, entry);
    classes.set(entry.key, entry.block);
  }
  for (const entry of options.blocks) {
    const old = Renamed.on(entry.block);
    if (old !== undefined && !entries.has(old)) {
      entries.set(old, entry);
      classes.set(old, entry.block);
    }
  }

  const [problem] = validateDocument(document, { kind, blocks: classes });
  if (problem !== undefined) {
    if (problem.code === "unknown_block" && problem.block !== undefined)
      throw UnknownBlockError.create({ block: problem.block, path: problem.path });
    throw InvalidDocumentError.create(
      problem.block === undefined
        ? { path: problem.path }
        : { path: problem.path, block: problem.block },
    );
  }

  const render = (node: CheckedNode, path: string): string => {
    const entry = entries.get(node.block) as ServerBlock;
    const schema = schemaOf(entry.block);
    const parsed = schema.parse(node.props ?? {});
    const inner = (node.children ?? [])
      .map((child, index) => render(child, `${path}.children.${index}`))
      .join("");
    const props = localizeValue(schema, parsed, locale) as Readonly<Record<string, unknown>>;
    return entry.html(props, inner, { locale, path, data });
  };

  const nodes: readonly CheckedNode[] =
    document === null || document === undefined
      ? []
      : ((Array.isArray(document) ? document : [document]) as CheckedNode[]);
  const body = nodes.map((node, index) => render(node, String(index))).join("");
  return (
    `<!doctype html><html lang="${escapeHtml(locale)}" dir="${options.direction ?? "auto"}">` +
    `<head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title></head>` +
    `<body>${body}</body></html>`
  );
}

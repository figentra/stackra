/**
 * Stackra file contract:
 * Purpose: `parseDocComment(raw)`, one `/** … *\/` comment as written in the source read into an `ApiDoc`.
 * Boundary: pure string work. Only the TSDoc block tags it knows start a block, so a decorator line inside an
 *           `@example` (`@Str({ max: 64 })`) stays in the example, and nothing inside a ``` fence is ever a tag.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard, amendment 2026-10-21); STA-2857.
 */
import type { ApiDocNamed } from "#scripts/api-reference/api-doc-named.type";
import type { ApiDoc } from "#scripts/api-reference/api-doc.type";

/** The block tags that start a new part; any other `@word` at a line start is text of the current part. */
const BLOCK_TAGS = new Set([
  "param",
  "typeParam",
  "template",
  "returns",
  "return",
  "yields",
  "throws",
  "example",
  "deprecated",
  "remarks",
  "see",
  "defaultValue",
  "default",
  "internal",
  "privateRemarks",
  "since",
  "beta",
  "alpha",
  "experimental",
  "public",
  "override",
  "sealed",
  "virtual",
  "readonly",
  "packageDocumentation",
]);

/** A line that starts a block tag: the tag name and the rest of the line. */
const TAG_LINE = /^@([A-Za-z]+)(?:\s+(.*))?$/;

/** A fence opener or closer (three or more backticks or tildes). */
const FENCE = /^\s*(`{3,}|~{3,})/;

/** The comment's text lines: delimiters and the leading ` * ` of each line removed. */
function commentLines(raw: string): string[] {
  const body = raw
    .trim()
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "");
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*(?: |(?=\S)|$)/, "").replace(/\s+$/, ""));
  // the text on the `/**` line itself carries the space that followed the opener
  lines[0] = lines[0]?.trimStart() ?? "";
  return lines;
}

/** Leading and trailing blank lines removed, then joined. */
function joinTrimmed(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]?.trim() === "") start += 1;
  while (end > start && lines[end - 1]?.trim() === "") end -= 1;
  return lines.slice(start, end).join("\n");
}

/** Removes the indentation every non-blank line shares, so an example keeps its relative indents. */
function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => /^\s*/.exec(line)?.[0].length ?? 0);
  const common = indents.length === 0 ? 0 : Math.min(...indents);
  return lines.map((line) => line.slice(common)).join("\n");
}

/** `name - text`, `name text` or `{Type} name - text` as a named block. */
function named(text: string): ApiDocNamed {
  const match = /^(?:\{[^}]*\}\s*)?\[?([\w$.]+)(?:=[^\]]*)?\]?\s*(?:-\s*)?([\s\S]*)$/.exec(
    text.trim(),
  );
  return match === null
    ? { name: text.trim(), text: "" }
    : { name: match[1] ?? "", text: (match[2] ?? "").trim() };
}

/**
 * The parts of one TSDoc comment.
 *
 * @param raw - the comment as written in the source, `/**` to `*\/` included.
 * @returns the summary and the block tags the reference prints; `internal` is true when the comment says `@internal`.
 * @example
 * parseDocComment("/** Adds two numbers.\n * @param a - the first\n * @returns the sum *\/").params;
 * // [{ name: "a", text: "the first" }]
 */
export function parseDocComment(raw: string): ApiDoc {
  const blocks: { tag: string; lines: string[] }[] = [{ tag: "", lines: [] }];
  let fence: string | undefined;
  for (const line of commentLines(raw)) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch !== null) {
      const marker = fenceMatch[1] ?? "";
      if (fence === undefined) fence = marker;
      else if (marker.startsWith(fence)) fence = undefined;
    }
    const tag = fence === undefined && fenceMatch === null ? TAG_LINE.exec(line.trim()) : null;
    if (tag !== null && BLOCK_TAGS.has(tag[1] ?? "")) {
      blocks.push({ tag: tag[1] ?? "", lines: tag[2] === undefined ? [] : [tag[2]] });
    } else {
      blocks.at(-1)?.lines.push(line);
    }
  }
  const params: ApiDocNamed[] = [];
  const typeParams: ApiDocNamed[] = [];
  const throws: string[] = [];
  const examples: string[] = [];
  const see: string[] = [];
  let summary = "";
  let remarks: string | undefined;
  let returns: string | undefined;
  let yields: string | undefined;
  let deprecated: string | undefined;
  let defaultValue: string | undefined;
  let internal = false;
  for (const block of blocks) {
    const text = joinTrimmed(block.lines);
    switch (block.tag) {
      case "": {
        summary = text;
        break;
      }
      case "param": {
        params.push(named(text));
        break;
      }
      case "typeParam":
      case "template": {
        typeParams.push(named(text));
        break;
      }
      case "returns":
      case "return": {
        returns = text;
        break;
      }
      case "yields": {
        yields = text;
        break;
      }
      case "throws": {
        throws.push(text);
        break;
      }
      case "example": {
        if (text !== "") examples.push(dedent(text));
        break;
      }
      case "deprecated": {
        deprecated = text;
        break;
      }
      case "remarks": {
        remarks = text;
        break;
      }
      case "see": {
        see.push(text);
        break;
      }
      case "defaultValue":
      case "default": {
        defaultValue = text;
        break;
      }
      case "internal": {
        internal = true;
        break;
      }
      default: {
        break;
      }
    }
  }
  return {
    summary,
    params,
    typeParams,
    throws,
    examples,
    see,
    internal,
    ...(remarks === undefined ? {} : { remarks }),
    ...(returns === undefined ? {} : { returns }),
    ...(yields === undefined ? {} : { yields }),
    ...(deprecated === undefined ? {} : { deprecated }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
  };
}

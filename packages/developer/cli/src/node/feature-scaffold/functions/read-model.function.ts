/**
 * Stackra file contract:
 * Purpose: `readModel(text)`, the facts of one model file that the action and query scaffolds build on: the exported
 *          class, its `HasPublicId` prefix and its own plain fields (string, number, boolean or Date, nullable or not)
 *          with the doc comment and decorators written above each, and where each decorator is imported from.
 * Boundary: pure; reads the source text the way the model scaffold writes it (one class, one property per line). A
 *           field of another type (a public id, an enum, a value object) and a field decorated from `@stackra/model`
 *           (a relation) are left out, so the scaffolds never guess at them.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R4: type-first shapes); ADR 0305 (one declaration per file); ADR 0135.
 */
import { snakeCase } from "@stackra/support";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";
import type { ModelFacts } from "#node/feature-scaffold/types/model-facts.type";

/** The plain types a scaffold mirrors. */
const PLAIN = new Set(["string", "number", "boolean", "Date"]);

/** One property declaration: `name!: type;` or `name?: type;`. */
const PROPERTY = /^(?:readonly\s+)?([a-zA-Z_]\w*)[!?]:\s*([^=;]+);$/;

/** The leading whitespace removed from every line by the smallest indent. */
function dedent(lines: readonly string[]): string[] {
  const indent = Math.min(...lines.map((line) => /^\s*/.exec(line)?.[0].length ?? 0));
  return lines.map((line) => line.slice(indent));
}

/**
 * The facts of a model file.
 *
 * @param text - the model file's source.
 * @param file - its path, for the refusal.
 * @throws CliUsageError when the file exports no class or has no `HasPublicId` prefix.
 * @example
 * readModel(source, "src/modules/orders/models/order.model.ts").prefix; // "ord"
 */
export function readModel(text: string, file: string): ModelFacts {
  const className = /export class (\w+)/.exec(text)?.[1];
  const prefix = /HasPublicId\(\s*"([a-z]+)"\s*\)/.exec(text)?.[1];
  if (className === undefined || prefix === undefined)
    throw new CliUsageError(
      `${file} exports no model with HasPublicId("<prefix>"); the action and query scaffolds address rows by public id`,
    );
  const imports = new Map<string, string>();
  for (const [, names = "", source = ""] of text.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/g,
  ))
    for (const name of names.split(",")) {
      const local =
        name
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .at(-1) ?? "";
      if (local !== "") imports.set(local, source);
    }

  const start = text.indexOf("{", text.indexOf("export class"));
  const body = text.slice(start + 1, text.lastIndexOf("}")).split("\n");
  const fields: FeatureField[] = [];
  let doc = "";
  let decorators: string[] = [];
  let pending: string[] = [];
  let depth = 0;
  let inDoc = false;
  let docLines: string[] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (inDoc || line.startsWith("/**")) {
      docLines.push(line);
      inDoc = !line.endsWith("*/");
      if (!inDoc) {
        doc = docLines
          .join(" ")
          .replaceAll(/^\/\*\*|\*\/$/g, "")
          .replaceAll(/\s\*\s?/g, " ")
          .replaceAll(/\s+/g, " ")
          .trim();
        docLines = [];
        decorators = [];
      }
      continue;
    }
    if (depth > 0 || line.startsWith("@")) {
      pending.push(raw);
      depth += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length;
      if (depth <= 0) {
        depth = 0;
        decorators.push(dedent(pending).join("\n"));
        pending = [];
      }
      continue;
    }
    const property = PROPERTY.exec(line);
    if (property !== null) {
      const [, name = "", written = ""] = property;
      const nullable = /\|\s*null\s*$/.test(written);
      const type = written.replace(/\|\s*null\s*$/, "").trim();
      const relation = decorators.some(
        (decorator) => imports.get(/^@(\w+)/.exec(decorator)?.[1] ?? "") === "@stackra/model",
      );
      if (PLAIN.has(type) && !relation)
        fields.push({
          name,
          column: snakeCase(name),
          type,
          nullable,
          decorators,
          doc: doc === "" ? `The ${snakeCase(name).replaceAll("_", " ")}.` : doc,
        });
    }
    if (line !== "") {
      doc = "";
      decorators = [];
    }
  }
  return { className, prefix, fields, imports };
}

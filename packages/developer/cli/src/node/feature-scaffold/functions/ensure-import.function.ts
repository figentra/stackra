/**
 * Stackra file contract:
 * Purpose: `ensureImport(text, names, source)`, a file that imports `names` from `source`: added to its existing
 *          value import of `source` (names kept sorted), or as a new import line after the last import.
 * Boundary: pure; reads single-line named imports, as oxfmt writes short ones. A name already imported is left as is.
 * Runtime: node
 * Governing contract: ADR 0305 (one declaration per file).
 */

/**
 * `text` importing `names` from `source`.
 *
 * @example
 * ensureImport('import { Str } from "@stackra/validation";\n', ["Int"], "@stackra/validation");
 * // 'import { Int, Str } from "@stackra/validation";\n'
 */
export function ensureImport(text: string, names: readonly string[], source: string): string {
  const quoted = JSON.stringify(source);
  const existing = new RegExp(`^import \\{([^}]*)\\} from ${quoted.replaceAll("/", "\\/")};$`, "m");
  const match = existing.exec(text);
  if (match !== null) {
    const have = (match[1] ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const merged = [...new Set([...have, ...names])].toSorted((left, right) =>
      left.replace(/^type /, "").localeCompare(right.replace(/^type /, "")),
    );
    return text.replace(existing, `import { ${merged.join(", ")} } from ${quoted};`);
  }
  const line = `import { ${[...names].toSorted().join(", ")} } from ${quoted};`;
  const imports = [...text.matchAll(/^import [^;]*;$/gm)];
  const last = imports.at(-1);
  if (last === undefined) return `${line}\n${text}`;
  const end = last.index + last[0].length;
  return `${text.slice(0, end)}\n${line}${text.slice(end)}`;
}

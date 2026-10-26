/**
 * Stackra file contract:
 * Purpose: `walkRepoFiles(root)`, the file list `readRepoContext` falls back to when git cannot list the repository (a
 *          worktree whose `.git` file points at a checkout that is not there, an exported tree): every file under
 *          `root`, repository-relative, minus what the `.gitignore` files on the way ignore, sorted.
 * Boundary: reads the folder tree and its `.gitignore` files; never enters `.git` or `node_modules`. Symbolic links are
 *           listed as files, as git lists them, and never followed.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); gitignore(5) pattern format.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** One compiled `.gitignore` line. */
type Rule = { readonly negate: boolean; readonly dirOnly: boolean; readonly regex: RegExp };

/** The folders the walk never enters. */
const NEVER = new Set([".git", "node_modules"]);

/** The regex source of one glob, gitignore flavour (`**`, `*`, `?`, `[…]`). */
function globSource(glob: string): string {
  let source = "";
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index] as string;
    if (glob.startsWith("**/", index)) {
      source += "(?:.*/)?";
      index += 2;
    } else if (glob.startsWith("**", index)) {
      source += ".*";
      index += 1;
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else if (char === "[" && glob.includes("]", index + 1)) {
      const end = glob.indexOf("]", index + 1);
      source += `[${glob.slice(index + 1, end).replace(/^!/, "^")}]`;
      index = end;
    } else if (char === "\\" && index + 1 < glob.length) source += `\\${glob[++index] as string}`;
    else source += char.replace(/[.+^${}()|\\]/g, "\\$&");
  }
  return source;
}

/** The rules of one `.gitignore` text, in file order. */
function compile(text: string): readonly Rule[] {
  return text.split(/\r?\n/).flatMap((raw) => {
    let line = raw.replace(/(?<!\\)\s+$/, "");
    if (line === "" || line.startsWith("#")) return [];
    const negate = line.startsWith("!");
    if (negate) line = line.slice(1);
    const dirOnly = line.endsWith("/");
    if (dirOnly) line = line.slice(0, -1);
    const anchored = line.includes("/");
    if (line.startsWith("/")) line = line.slice(1);
    if (line === "") return [];
    return [
      { negate, dirOnly, regex: new RegExp(`^${anchored ? "" : "(?:.*/)?"}${globSource(line)}$`) },
    ];
  });
}

/**
 * Every file under `root` that the `.gitignore` files do not ignore, repository-relative with forward slashes.
 *
 * @param root - the absolute repository root.
 * @example
 * walkRepoFiles("/repo"); // ["AGENTS.md", "apps/docs/package.json", …]
 */
export function walkRepoFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (
    dir: string,
    scopes: readonly { base: string; rules: readonly Rule[] }[],
  ): void => {
    const ignore = join(root, dir, ".gitignore");
    const here = existsSync(ignore)
      ? [...scopes, { base: dir, rules: compile(readFileSync(ignore, "utf8")) }]
      : scopes;
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (NEVER.has(entry.name)) continue;
      const path = dir === "" ? entry.name : `${dir}/${entry.name}`;
      const isDir = entry.isDirectory();
      let ignored = false;
      for (const { base, rules } of here) {
        const sub = base === "" ? path : path.slice(base.length + 1);
        for (const rule of rules)
          if ((!rule.dirOnly || isDir) && rule.regex.test(sub)) ignored = !rule.negate;
      }
      if (ignored) continue;
      if (isDir) visit(path, here);
      else files.push(path);
    }
  };
  visit("", []);
  return files.sort();
}

/**
 * Stackra file contract:
 * Purpose: `writeIfChanged(file, content)`, a write that leaves an unchanged file alone, so a watcher of the local
 *          monolith app (`encore run`) reloads only on a real edit.
 * Boundary: internal to `./node`, not re-exported; creates the file's folders.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); STA-2840.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Writes `content` at `file` when it differs from what is there.
 *
 * @returns whether it wrote.
 * @example
 * writeIfChanged("/app/encore.app", '{ "id": "acme" }\n'); // true, then false
 */
export function writeIfChanged(file: string, content: string | Buffer): boolean {
  const bytes = typeof content === "string" ? Buffer.from(content) : content;
  if (existsSync(file) && readFileSync(file).equals(bytes)) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return true;
}

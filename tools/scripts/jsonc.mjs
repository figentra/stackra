/**
 * Stackra file contract:
 * Purpose: the one JSONC reader the repo scripts share (agents-sync, validate-repository). Drops // and /* *\/
 *          comments outside strings and trailing commas, then JSON.parse. No dependency: node has no JSONC API.
 * Boundary: text to value only; no file is written.
 * Runtime: node
 * Governing contract: ADR 0007 (source documentation standard).
 * Scope: tools/scripts/*.mjs · Owner: release-operations · Secrets: forbidden
 */
import { readFileSync } from "node:fs";

/** JSONC → JSON text: drops // and /* *\/ comments outside strings, then trailing commas. */
export function stripJsonc(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      const start = i;
      for (i++; i < text.length && text[i] !== '"'; i++) if (text[i] === "\\") i++;
      out += text.slice(start, i + 1);
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2);
      if (i === -1) throw new Error("unterminated /* comment");
      i++;
    } else out += c;
  }
  return out.replaceAll(/,(\s*[}\]])/g, "$1");
}

/** Parses a .json or .jsonc file. */
export function readJsonc(path) {
  return JSON.parse(stripJsonc(readFileSync(path, "utf8")));
}

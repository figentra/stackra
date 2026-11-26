/**
 * Stackra file contract:
 * Purpose: `sharedBoxFindings(root, files?)`, the shared-box rules of `stackra validate --repository`: a test must
 *          not take a resource another run on the same machine can hold, because the build boxes run many suites at
 *          once (STA-2777: a fixed relay port; STA-2780: the host's deploy lock). Findings, per test file and line:
 *          binding a literal port (`.listen(4000)`, `.bind(4000)`, `.listen({ port: 4000 })`, `new …Server({ port:
 *          4000 })`); a variable named for a port that holds a fixed number (`const PORT = 47_913`); and a write to a
 *          fixed shared path (a literal under `/tmp/` or `/var/tmp/`, `join(tmpdir(), "<fixed name>")`) or into the real
 *          home folder (`homedir()`), read from the argument the call writes (a link or a copy's destination, both
 *          ends of a move, else the first). The way out is a port of 0 and the one the OS gave, a private `mkdtemp`
 *          folder, or a stand-in folder passed to the code. A `// shared-box: <reason>` comment on the line or the line
 *          above accepts one deliberately (a port that is data, never bound).
 * Boundary: reads the test files (`testFiles`); writes nothing. Patterns run over `maskCode` output, so text inside
 *           a string or a comment never matches; paths are read back from the original text.
 * Runtime: node
 * Governing contract: ADR 0182 (decisions 3 and 4); STA-2842.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sorted } from "#node/functions/sorted.function";
import { maskCode } from "#node/test-markers/functions/mask-code.function";
import { testFiles } from "#node/test-markers/functions/test-files.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/** `.listen(` / `.bind(` with a literal port, bare or as `{ port: … }`. */
const BOUND_PORT = /\.(?:listen|bind)\s*\(\s*(?:\{[^{}]*?\bport\s*:\s*)?([1-9][\d_]*)\b/g;

/** `new <Name>Server({ port: … })` with a literal port. */
const SERVER_PORT = /\bnew\s+[\w$]*Server\s*\(\s*\{[^{}]*?\bport\s*:\s*([1-9][\d_]*)\b/g;

/** A declaration of a variable that holds a fixed number. */
const NUMBER_VARIABLE =
  /(?<![\w$.])(?:const|let|var)\s+([\w$]+)\s*(?::\s*number\s*)?=\s*([1-9][\d_]*)\s*(?=[;,\n])/g;

/** Whether a variable name has `port` (or `ports`) as one of its words: `PORT`, `DISCOVERY_PORT`, `relayPort`. */
function isPortName(name: string): boolean {
  return name
    .replaceAll(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/[\s_$]+/)
    .some((word) => /^ports?$/i.test(word));
}

/** A file-system call that writes, up to its opening parenthesis; the name is group 1. */
const WRITE_CALL =
  /(?<![\w$])(writeFileSync|appendFileSync|mkdirSync|rmSync|cpSync|copyFileSync|renameSync|symlinkSync|openSync|createWriteStream|writeFile|appendFile|mkdir|rm|cp|copyFile|rename|symlink)\s*\(/g;

/**
 * The arguments a write call changes, by position, where it is not only the first: a link, a copy's destination, and
 * both ends of a move. A symlink's target (`symlinkSync(homedir(), link)`) is read, not written.
 */
const WRITTEN_ARGUMENTS: Readonly<Record<string, readonly number[]>> = {
  symlinkSync: [1],
  symlink: [1],
  cpSync: [1],
  cp: [1],
  copyFileSync: [1],
  copyFile: [1],
  renameSync: [0, 1],
  rename: [0, 1],
};

/** A first argument naming a fixed path under the shared temp folder. */
const SHARED_TEMP =
  /^(?:(["'`])\/(?:var\/)?tmp\/[^"'`]*\1|join\(\s*(?:os\.)?tmpdir\(\)\s*,\s*(["'`])[^"'`$]*\2\s*\))$/;

/** A first argument inside the real home folder. */
const HOME = /^(?:join\(\s*(?:os\.)?homedir\(\)|(?:os\.)?homedir\(\)|`\$\{(?:os\.)?homedir\(\)\})/;

/** A `shared-box:` acceptance with its reason. */
const ACCEPTED = /\bshared-box:\s*\S/;

/** The end (exclusive) of the argument starting at `start` in masked code: the next `,` or `)` at depth 0. */
function argumentEnd(masked: string, start: number): number {
  let depth = 0;
  for (let at = start; at < masked.length; at += 1) {
    const char = masked[at];
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") {
      if (depth === 0) return at;
      depth -= 1;
    } else if (char === "," && depth === 0) return at;
  }
  return masked.length;
}

/** The findings of one test file's source. */
function fileFindings(file: string, source: string): DirFinding[] {
  const masked = maskCode(source);
  const lines = source.split("\n");
  const starts: number[] = [0];
  for (let at = 0; at < source.length; at += 1) if (source[at] === "\n") starts.push(at + 1);
  const lineOf = (offset: number): number => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if ((starts[middle] ?? 0) <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };
  const found: { readonly line: number; readonly text: string }[] = [];
  const report = (offset: number, text: string): void => {
    const line = lineOf(offset);
    if (ACCEPTED.test(lines[line - 1] ?? "") || ACCEPTED.test(lines[line - 2] ?? "")) return;
    found.push({ line, text });
  };
  for (const pattern of [BOUND_PORT, SERVER_PORT])
    for (const match of masked.matchAll(pattern))
      report(
        match.index,
        `binds the fixed port ${match[1] ?? ""}, which another run on the box can hold: listen on port 0 and read the port the OS gave`,
      );
  for (const match of masked.matchAll(NUMBER_VARIABLE)) {
    const port = Number((match[2] ?? "").replaceAll("_", ""));
    if (isPortName(match[1] ?? "") && port <= 65_535)
      report(
        match.index,
        `${match[1] ?? ""} fixes port ${port}, which another run on the box can hold: take a free port from the OS (listen on 0)`,
      );
  }
  for (const match of masked.matchAll(WRITE_CALL)) {
    const written = WRITTEN_ARGUMENTS[match[1] ?? ""] ?? [0];
    let start = match.index + match[0].length;
    for (let position = 0; position <= Math.max(...written); position += 1) {
      const end = argumentEnd(masked, start);
      const argument = source.slice(start, end).trim();
      if (written.includes(position) && SHARED_TEMP.test(argument))
        report(
          match.index,
          `writes the fixed shared path ${argument}, which another run on the box can hold: make a private folder with mkdtemp`,
        );
      else if (written.includes(position) && HOME.test(argument))
        report(
          match.index,
          `writes into the real home folder (${argument}): pass the code a stand-in folder from mkdtemp`,
        );
      if (masked[end] !== ",") break;
      start = end + 1;
    }
  }
  return sorted(found, (left, right) => left.line - right.line).map(({ line, text }) => ({
    dir: file,
    text: `line ${line}: ${text}`,
  }));
}

/**
 * The shared-box findings of the test files of the checkout at `root`.
 *
 * @param root - the checkout root.
 * @param files - the test files to read (repository-relative); every test file when absent.
 * @example
 * sharedBoxFindings(root); // [{ dir: "packages/…/relay.test.ts", text: "line 18: PORT fixes port 47913, …" }]
 */
export function sharedBoxFindings(
  root: string,
  files: readonly string[] = testFiles(root),
): DirFinding[] {
  return files.flatMap((file) => fileFindings(file, readFileSync(join(root, file), "utf8")));
}

#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: read packed npm tarballs (`.tgz`, as `pnpm pack` writes them) and refuse two kinds of file before anything
 *          is published: a test file (a `__tests__`, `__fixtures__`, `__snapshots__` or `__mocks__` folder, a
 *          `*.test.*`, `*.spec.*`, `*.test-d.*` or `*.bench.*` file) and a file holding a secret-shaped string (the
 *          rules of `pack-content.mjs`). The workspace pack hook keeps both out as it packs; this reads what was
 *          actually packed, so it also holds for a tarball made elsewhere (STA-2917).
 * Boundary: read-only; node built-ins only. Takes the tarball paths as its last arguments, the contract of the
 *           release workflow's `pack-check` command (STA-2911). A finding names the tarball, the file, the line and
 *           the kind of string, never the string.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks on the packed tarball); ADR 0453 (the registry ships what the
 *                     tarball holds); STA-2917.
 * Usage: `scan-tarballs.mjs <file.tgz>…`
 * Exit: 0 clean, 1 findings (each printed as `<tarball>: <path>:<line>: <reason>`; line 0 is the path itself),
 *       2 usage or a tarball that cannot be read.
 * Secrets: forbidden.
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

import { isTestPath, secretFindings } from "./pack-content.mjs";

/** A NUL-terminated text field of a 512-byte tar header. */
function field(header, start, length) {
  const bytes = header.subarray(start, start + length);
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end < 0 ? length : end).toString("utf8");
}

/** Whether `header`'s checksum field matches its bytes (the field itself counted as eight spaces). */
function checksumHolds(header) {
  const stored = Number.parseInt(field(header, 148, 8).trim(), 8);
  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 0x20 : header[i];
  return stored === sum;
}

/** The `path` record of a pax extended header body (`<len> <key>=<value>\n` records), if it has one. */
function paxPath(body) {
  let offset = 0;
  while (offset < body.length) {
    const space = body.indexOf(0x20, offset);
    const length = Number.parseInt(body.subarray(offset, space).toString("utf8"), 10);
    if (space < 0 || !Number.isInteger(length) || length <= 0) return undefined;
    const record = body.subarray(space + 1, offset + length - 1).toString("utf8");
    const equals = record.indexOf("=");
    if (record.slice(0, equals) === "path") return record.slice(equals + 1);
    offset += length;
  }
  return undefined;
}

/**
 * The regular files of a gzipped tar archive, as `{ path, data }` in archive order. Reads ustar names with their
 * prefix, pax `path` records and GNU long names.
 * @throws when the archive is not gzip, a header's checksum does not hold, or a file is cut short.
 */
export function tarEntries(tgz) {
  const tar = gunzipSync(tgz);
  const entries = [];
  let offset = 0;
  let longPath;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    if (!checksumHolds(header)) throw new Error(`no tar header at byte ${offset}`);
    const size = Number.parseInt(field(header, 124, 12).trim() || "0", 8);
    if (!Number.isSafeInteger(size) || size < 0) throw new Error(`a bad size at byte ${offset}`);
    const type = header[156] === 0 ? "0" : String.fromCodePoint(header[156]);
    const body = tar.subarray(offset + 512, offset + 512 + size);
    if (body.length < size) throw new Error("the archive is cut short");
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") longPath = paxPath(body) ?? longPath;
    else if (type === "L") longPath = field(body, 0, body.length);
    else if (type !== "g") {
      const prefix = field(header, 345, 155);
      const name = field(header, 0, 100);
      const path = longPath ?? (prefix ? `${prefix}/${name}` : name);
      longPath = undefined;
      if (type === "0" || type === "7") entries.push({ path, data: body });
    }
  }
  return entries;
}

/**
 * Every finding in one tarball's bytes, as `<path>:<line>: <reason>` with the archive's top folder (`package/`)
 * removed from each path.
 */
export function tarballFindings(tgz) {
  const findings = [];
  for (const { path, data } of tarEntries(tgz)) {
    const inPackage = path.replace(/^[^/]+\//, "");
    if (isTestPath(inPackage)) {
      findings.push(`${inPackage}:0: a test file`);
      continue;
    }
    for (const { line, rule, what } of secretFindings(data))
      findings.push(`${inPackage}:${line}: ${what} (${rule})`);
  }
  return findings;
}

/** Runs the command line; returns the exit code. */
export function main(argv, out = console.log, err = console.error) {
  const files = argv.filter((arg) => arg !== "--");
  if (files.length === 0 || files.some((file) => file.startsWith("-"))) {
    err("usage: scan-tarballs.mjs <file.tgz>…");
    return 2;
  }
  let found = 0;
  for (const file of files) {
    let findings;
    try {
      findings = tarballFindings(readFileSync(file));
    } catch (error) {
      err(`${file}: cannot read the tarball: ${error.message}`);
      return 2;
    }
    for (const finding of findings) out(`${basename(file)}: ${finding}`);
    found += findings.length;
  }
  if (found > 0) {
    err(
      `${found} finding(s) in ${files.length} tarball(s): a published tarball holds no test file and no secret-shaped string`,
    );
    return 1;
  }
  out(`${files.length} tarball(s) clean`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2));

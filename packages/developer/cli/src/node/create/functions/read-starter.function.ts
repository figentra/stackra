/**
 * Stackra file contract:
 * Purpose: `readStarter(source)`, a local starter's files by POSIX path: a `.tgz` (a packed `@stackra/starter`)
 *          through `starterTarball`, or a git checkout of the template through `git ls-files` (tracked files
 *          plus new ones git does not ignore), so a checkout's `node_modules`, build output and stray files never
 *          reach the app.
 * Boundary: reads files and runs local `git ls-files`; writes nothing. A folder that is not a git checkout is
 *           refused.
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3: `--starter <dir|tgz>`); STA-1952 spec FR-005.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { starterTarball } from "#node/create/functions/starter-tarball.function";

/**
 * The files of a local starter.
 *
 * @param source - a `.tgz` or a template checkout.
 * @throws Error when the folder is not a git checkout.
 * @example
 * readStarter("../stackra-template").get("stackra.starter.yaml");
 */
export function readStarter(source: string): Map<string, Uint8Array> {
  if (!statSync(source).isDirectory()) return starterTarball(readFileSync(source));
  let listing: string;
  try {
    listing = execFileSync(
      "git",
      ["-C", source, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
  } catch {
    throw new Error(`${source} is not a git checkout; pass a template checkout or a starter .tgz`);
  }
  const files = new Map<string, Uint8Array>();
  for (const path of listing.split("\0")) {
    if (path === "") continue;
    try {
      files.set(path, new Uint8Array(readFileSync(join(source, path))));
    } catch {
      // a tracked file deleted in the working tree is listed but gone
    }
  }
  return files;
}

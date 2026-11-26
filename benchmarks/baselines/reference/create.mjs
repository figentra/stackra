#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: create the "reference" baseline's starting app in a directory: a copy of starting-app/, no install step.
 * Boundary: copies files from this folder into the directory given as the first argument; no network.
 * Runtime: node
 * Governing contract: benchmarks/tasks/starting-app.md.
 * Input: the target directory, as the first argument.
 * Output: the files of starting-app/ in the target directory.
 * Secrets: none.
 */
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const target = process.argv[2];
if (target === undefined) {
  process.stderr.write("usage: node create.mjs <directory>\n");
  process.exit(2);
}
mkdirSync(resolve(target), { recursive: true });
cpSync(join(dirname(fileURLToPath(import.meta.url)), "starting-app"), resolve(target), {
  recursive: true,
});

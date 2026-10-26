/**
 * Stackra file contract:
 * Purpose: `runBrandKit(argv, io, variable)`, the `brand-kit` command line:
 *          - `brand-kit generate <kit> --out <dir> [--screenshots <dir>] [--store <dir>] [--json]` runs the generator
 *            (Runway's CI step passes `<repo>/assets/brand` and `.stackra/brand`) and prints the files it wrote, or
 *            the run record as JSON with `--json`;
 *          - `brand-kit check [<kit>…] [--registry <file>]` checks each kit found (`findKits`, with
 *            `STACKRA_BRAND_KITS`), or `assets/brand` when nothing names a kit, and prints one line per kit and
 *            problem.
 *          It resolves with the exit code: 0 done, 1 a kit failed, 2 a usage error.
 * Boundary: the only reader of the arguments; every rule lives in the functions it calls. A kit or theme error is
 *           printed with its problems, never a stack.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 5: Runway runs the generator in CI); ported from figentra/os
 *                     `tools/brand-kit/kit.mjs` (ORIGIN.md).
 */
import { relative } from "node:path";
import { parseArgs } from "node:util";

import { InvalidThemeError } from "@stackra/tokens";

import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { checkKitFolder } from "#node/functions/check-kit-folder.function";
import { findKits } from "#node/functions/find-kits.function";
import { generateBrand } from "#node/functions/generate-brand.function";
import type { BrandKitIo } from "#node/types/brand-kit-io.type";

/** The synopsis printed on `--help` and after a usage error. */
const USAGE = `usage:
  brand-kit generate <kit> --out <dir> [--screenshots <dir>] [--store <dir>] [--json]
  brand-kit check [<kit>…] [--registry <file>]
`;

/** The options both commands accept. */
const OPTIONS = {
  out: { type: "string" },
  screenshots: { type: "string" },
  store: { type: "string" },
  registry: { type: "string" },
  json: { type: "boolean" },
  help: { type: "boolean", short: "h" },
} as const;

/**
 * Runs one command line.
 *
 * @param argv - the arguments after the program name.
 * @param io - where to write.
 * @param variable - the value of `STACKRA_BRAND_KITS`, when set.
 * @example
 * process.exitCode = await runBrandKit(process.argv.slice(2), io, process.env["STACKRA_BRAND_KITS"]);
 */
export async function runBrandKit(
  argv: readonly string[],
  io: BrandKitIo,
  variable?: string,
): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({ args: [...argv], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    io.err(`${(error as Error).message}\n${USAGE}`);
    return 2;
  }
  const { values, positionals } = parsed;
  const [command, ...kits] = positionals;
  if (values.help === true) {
    io.out(USAGE);
    return 0;
  }
  try {
    if (command === "generate") {
      const [kit, ...extra] = kits;
      if (kit === undefined || extra.length > 0 || values.out === undefined) {
        io.err(USAGE);
        return 2;
      }
      const result = await generateBrand({
        kit,
        out: values.out,
        screenshots: values.screenshots,
        store: values.store,
      });
      io.out(values.json === true ? `${JSON.stringify(result)}\n` : `${result.files.join("\n")}\n`);
      return 0;
    }
    if (command === "check") {
      const named = kits.length > 0 || values.registry !== undefined || (variable ?? "") !== "";
      const { kits: found, skipped } = findKits({
        registry: values.registry,
        variable,
        folders: named ? kits : ["assets/brand"],
      });
      for (const note of skipped) io.out(`note: kit skipped: ${note}\n`);
      let failed = 0;
      for (const located of found) {
        const problems = checkKitFolder(located);
        failed += problems.length > 0 ? 1 : 0;
        io.out(
          `${problems.length > 0 ? "FAIL" : "ok"}  ${located.kit.id} (${relative(process.cwd(), located.dir) || "."})\n`,
        );
        for (const problem of problems) io.out(`    ${problem}\n`);
      }
      return failed > 0 ? 1 : 0;
    }
  } catch (error) {
    if (error instanceof InvalidKitError || error instanceof InvalidThemeError) {
      io.err(`${error.message}\n`);
      return 1;
    }
    throw error;
  }
  io.err(USAGE);
  return 2;
}

/**
 * Stackra file contract:
 * Purpose: `runGen(root, options, io)`, one gen run over one member as the CLI prints it: every refusal in gen's
 *          two-line form, then the files written, or with `check` the files that are stale. It resolves true when the
 *          member is clean: no refusal, and with `check` nothing stale.
 * Boundary: gen writes only under the member root and only when there is no refusal; a check writes nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10, 22 and 26: the committed manifest, `stackra gen --check`, refusals
 *                     print their fix); ADR 0295 (decision 5).
 */
import { relative } from "node:path";

import { formatGenError } from "@stackra/gen";
import { generate } from "@stackra/gen/node";

import type { CliIo } from "#node/types/cli-io.type";

/**
 * Runs gen on the member at `root` and prints the outcome.
 *
 * @param root - the member root.
 * @param options - `check` compares instead of writing; `backend` picks the TypeScript host; `base` is the folder
 *                  printed paths are relative to (default: the working directory).
 * @param io - where the outcome is printed.
 * @throws Error when gen cannot read the member's package.json, tsconfig or a dependency manifest.
 * @example
 * const clean = await runGen("packages/commerce/loyalty-kit", { check: true }, PROCESS_IO);
 */
export async function runGen(
  root: string,
  options: {
    readonly check?: boolean;
    readonly backend?: "tsgo" | "ts6";
    readonly base?: string;
  },
  io: CliIo,
): Promise<boolean> {
  const where = relative(options.base ?? process.cwd(), root) || ".";
  const { errors, changed } = await generate(root, {
    ...(options.check === undefined ? {} : { check: options.check }),
    ...(options.backend === undefined ? {} : { backend: options.backend }),
  });
  for (const error of errors) io.err(`${where}/${formatGenError(error)}\n`);
  if (errors.length > 0) {
    io.err(`gen: ${errors.length} error(s) in ${where}; nothing was written\n`);
    return false;
  }
  if (options.check === true) {
    for (const path of changed) io.err(`stale: ${where}/${path}\n`);
    if (changed.length > 0) {
      io.err(`gen --check: ${where} is out of date; run \`stackra gen\` and commit the result\n`);
      return false;
    }
    return true;
  }
  for (const path of changed) io.out(`wrote ${where}/${path}\n`);
  return true;
}

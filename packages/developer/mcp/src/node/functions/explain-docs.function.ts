/**
 * Stackra file contract:
 * Purpose: `explainDocs(run)`, the docs link of a diagnostic's code as `stackra explain <code> --json` gives it, run
 *          through the server's CLI runner and kept per code for the server's life. So a tool result links each code
 *          to the same error-code reference entry a person reaches with `stackra explain`, including a check finding's
 *          `<tool>/<rule>`, and never to a page the reference does not list.
 * Boundary: runs only `stackra explain`, which reads the reference and writes nothing. A code the reference does not
 *           list, a CLI without `explain`, or a run that prints no document resolves undefined: no link is invented.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local MCP shares the CLI's commands); STA-2891 (`stackra explain` and
 *                     the error-code reference); STA-2886.
 */
import type { StackraRunner } from "#node/types/stackra-runner.type";

/** The `data.docs` of the last JSON document line `output` holds, or undefined. */
function docsOf(output: string): string | undefined {
  const lines = output.split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index] ?? "";
    if (!line.startsWith("{")) continue;
    try {
      const document = JSON.parse(line) as { ok?: unknown; data?: { docs?: unknown } };
      const docs = document.data?.docs;
      return document.ok === true && typeof docs === "string" && docs !== "" ? docs : undefined;
    } catch {
      // Not the document; an earlier line may be.
    }
  }
  return undefined;
}

/**
 * A cached lookup of a code's docs link through `run`.
 *
 * @param run - the server's CLI runner.
 * @example
 * const docs = explainDocs(run);
 * await docs("shape_number_kind"); // "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields"
 */
export function explainDocs(run: StackraRunner): (code: string) => Promise<string | undefined> {
  const known = new Map<string, Promise<string | undefined>>();
  return (code) => {
    let found = known.get(code);
    if (found === undefined) {
      found = run(["explain", code, "--json"]).then(
        ({ exitCode, output }) => (exitCode === 0 ? docsOf(output) : undefined),
        () => undefined,
      );
      known.set(code, found);
    }
    return found;
  };
}

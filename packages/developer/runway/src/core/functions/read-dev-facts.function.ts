/**
 * Stackra file contract:
 * Purpose: `readDevFacts()`, the dev facts `stackra dev` wrote: the nearest `.stackra/dev/ports.json` walking up from
 *          the working directory, parsed; `undefined` when there is none or the runtime has no file system.
 * Boundary: internal. Reaches `node:fs` and `node:path` through `process.getBuiltinModule` at call time, never by a
 *           static import, so the `.` entry stays safe to bundle for a browser; outside Node it returns `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5).
 */
import { DEV_FACTS_PATH } from "#core/constants/dev-facts-path.constant";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunwayFacts } from "#core/functions/parse-runway-facts.function";
import type { RunwayFacts } from "#core/types/runway-facts.type";

/**
 * The dev facts of the repository the working directory is in.
 *
 * @throws RunwayInvalidError when the file exists but is not valid JSON or breaks the facts schema.
 * @example
 * readDevFacts()?.members.console?.port; // 5173 on lane 0
 */
export function readDevFacts(): RunwayFacts | undefined {
  if (typeof process === "undefined" || typeof process.getBuiltinModule !== "function") {
    return undefined;
  }
  const fs = process.getBuiltinModule("node:fs");
  const path = process.getBuiltinModule("node:path");
  for (let directory = process.cwd(); ; directory = path.dirname(directory)) {
    const file = path.join(directory, DEV_FACTS_PATH);
    if (fs.existsSync(file)) {
      let document: unknown;
      try {
        document = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (error) {
        throw new RunwayInvalidError(file, [
          { path: "", message: `Not JSON: ${(error as Error).message}` },
        ]);
      }
      return parseRunwayFacts(document, file);
    }
    if (path.dirname(directory) === directory) return undefined;
  }
}

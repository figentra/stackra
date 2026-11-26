/**
 * Stackra file contract:
 * Purpose: `readStackraPins(root)`, every exact `@stackra/*` version a workspace pins, from the files
 *          `stackraPinFiles` names: the version `stackra upgrade` starts from is the oldest of them.
 * Boundary: reads those files; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { bumpStackraPins } from "#node/upgrade/functions/bump-stackra-pins.function";
import { stackraPinFiles } from "#node/upgrade/functions/stackra-pin-files.function";
import type { StackraPin } from "#node/upgrade/types/stackra-pin.type";

/**
 * The pins of a workspace.
 *
 * @example
 * readStackraPins("/repo"); // [{ file: "pnpm-workspace.yaml", name: "@stackra/actions", version: "0.30.1" }, …]
 */
export function readStackraPins(root: string): readonly StackraPin[] {
  return stackraPinFiles(root).flatMap((file) =>
    bumpStackraPins(
      readFileSync(join(root, file), "utf8"),
      file.endsWith(".yaml") ? "yaml" : "json",
      undefined,
    ).pins.map((pin) => ({ file, name: pin.name, version: pin.from.replace(/^[=^~]/, "") })),
  );
}

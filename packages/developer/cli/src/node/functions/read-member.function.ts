/**
 * Stackra file contract:
 * Purpose: `readMember(root)`, the member a tool command runs in: its layout from the `define*` call of
 *          `stackra.config.ts` and an app's targets from its committed `stackra.manifest.json`, which gen writes
 *          before the tool runs.
 *          A member with `src/config/docs.config.ts` is the docs app whatever its `define*` call (STA-1316); one with
 *          `src/docs.json` and no `stackra.config.ts` is a docs app in the layout before it (until each sweep).
 * Boundary: reads two files; never runs `stackra.config.ts`. The call name is read from the text, as gen's own member
 *           reader does, because the file holds one static `define*` call.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1 and 2); ADR 0294 (decision 10: the committed manifest).
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { StackraManifest } from "@stackra/contracts";
import { DOCS_CONFIG_FILE } from "@stackra/gen";

import type { Member } from "#node/types/member.type";

/** The layout each `define*` call declares. */
const LAYOUTS: Readonly<Record<string, Member["layout"]>> = {
  defineApp: "app",
  definePackage: "package",
  defineService: "service",
  defineWorker: "worker",
};

/**
 * The member at `root`.
 *
 * @param root - the member root (the folder holding package.json).
 * @throws Error when `stackra.config.ts` exists but calls no `define*` function.
 * @example
 * readMember("apps/web"); // { root: "/repo/apps/web", layout: "app", targets: ["web"] }
 */
export function readMember(root: string): Member {
  const absolute = resolve(root);
  if (existsSync(join(absolute, DOCS_CONFIG_FILE)))
    return { root: absolute, layout: "docs", targets: [] };
  const configPath = join(absolute, "stackra.config.ts");
  if (!existsSync(configPath)) {
    const layout = existsSync(join(absolute, "src", "docs.json")) ? "docs" : "tooling";
    return { root: absolute, layout, targets: [] };
  }
  const call = /\b(define(?:App|Package|Service|Worker))\s*\(/.exec(
    readFileSync(configPath, "utf8"),
  )?.[1];
  const layout = call === undefined ? undefined : LAYOUTS[call];
  if (layout === undefined) {
    throw new Error(
      `${configPath} calls no defineApp, definePackage, defineService or defineWorker`,
    );
  }
  const manifestPath = join(absolute, "stackra.manifest.json");
  const targets =
    layout === "app" && existsSync(manifestPath)
      ? ((JSON.parse(readFileSync(manifestPath, "utf8")) as StackraManifest).targets ?? [])
      : [];
  return { root: absolute, layout, targets };
}

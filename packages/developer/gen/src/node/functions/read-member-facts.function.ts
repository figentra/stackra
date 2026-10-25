/**
 * Stackra file contract:
 * Purpose: `readMemberFacts`, the facts discovery needs before it reads a class: the member key from the folder name,
 *          the package name, version and dependencies from package.json, the layout from the `define*` call of
 *          `stackra.config.ts` (or the folder the member sits in), and an app's `area` and `targets`.
 * Boundary: reads two files; never runs `stackra.config.ts`. The `define*` call holds static data, so its call name and
 *           the enum cases of `area` and `targets` are read from the text.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20, 2026-10-23 item 14: the member key is the folder name); ADR 0295
 *                     (decision 1: one static `define*` call).
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";

import { ApiArea, Target } from "@stackra/contracts";

import { folderKey } from "#core/functions/folder-key.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { MemberFacts } from "#node/types/member-facts.type";

/** The layout each `define*` call declares. */
const LAYOUTS: Readonly<Record<string, MemberIR["layout"]>> = {
  defineApp: "app",
  definePackage: "package",
  defineService: "service",
  defineWorker: "worker",
};

/** The code of an `Enum.of` case name, or the name itself when it is a code already. */
function codeOf(enumeration: Readonly<Record<string, unknown>>, name: string): string {
  const code = enumeration[name];
  return typeof code === "string" ? code : name;
}

/**
 * The facts of the member at `root`.
 *
 * @param root - the member root (the folder holding package.json).
 * @throws Error when package.json is missing or has no name.
 * @example
 * readMemberFacts("/repo/packages/commerce/loyalty-kit").member; // "loyalty_kit"
 */
export function readMemberFacts(root: string): MemberFacts {
  const absolute = resolve(root);
  const manifestPath = join(absolute, "package.json");
  if (!existsSync(manifestPath)) throw new Error(`no package.json at ${absolute}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    name?: unknown;
    version?: unknown;
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };
  if (typeof manifest.name !== "string") throw new Error(`${manifestPath} has no name`);

  const configPath = join(absolute, "stackra.config.ts");
  // shortcut: the static `define*` argument is read by pattern, not parsed; upgrade to the host's syntax tree when a
  // tool section (STA-339) needs more than the call name, `area` and `targets`.
  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  const call = /\b(define(?:App|Package|Service|Worker))\s*\(/.exec(config)?.[1];
  const segments = absolute.split(sep);
  const layout: MemberIR["layout"] =
    (call === undefined ? undefined : LAYOUTS[call]) ??
    (segments.includes("services")
      ? "service"
      : segments.includes("apps")
        ? "app"
        : segments.includes("workers")
          ? "worker"
          : "package");

  const area = /\barea\s*:\s*ApiArea\.(\w+)/.exec(config)?.[1];
  const targetList = /\btargets\s*:\s*\[([^\]]*)\]/.exec(config)?.[1];
  const targets =
    targetList === undefined
      ? undefined
      : [...targetList.matchAll(/Target\.(\w+)/g)].map((match) => codeOf(Target, match[1] ?? ""));

  return {
    root: absolute,
    member: folderKey(basename(absolute)),
    package: manifest.name,
    version: typeof manifest.version === "string" ? manifest.version : "0.0.0",
    layout,
    ...(layout === "app" ? { kind: "app" as const } : {}),
    ...(area !== undefined ? { area: codeOf(ApiArea, area) } : {}),
    ...(targets !== undefined ? { targets } : {}),
    dependencies: [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ],
  };
}

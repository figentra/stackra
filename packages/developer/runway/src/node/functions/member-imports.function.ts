/**
 * Stackra file contract:
 * Purpose: `memberImports(root)`, a service member's package.json `imports` map, which `rewriteMemberAliases` rewrites
 *          `#` imports through for the deploy tree (`encoreDeployTree`) and the local monolith app (`syncDevEncoreApp`).
 * Boundary: internal to `./node`, not re-exported; reads one package.json.
 * Runtime: node
 * Governing contract: ADR 0233 (package.json imports); STA-2155; STA-2840.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The member's package.json `imports` map, `{}` when it has none.
 *
 * @param root - the member root.
 * @example
 * memberImports("/repo/services/billing")["#src/*"]; // ["./src/*", "./src/*.ts", …]
 */
export function memberImports(root: string): Readonly<Record<string, unknown>> {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  return typeof manifest["imports"] === "object" && manifest["imports"] !== null
    ? (manifest["imports"] as Record<string, unknown>)
    : {};
}

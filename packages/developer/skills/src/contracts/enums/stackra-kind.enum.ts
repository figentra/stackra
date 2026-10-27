/**
 * Stackra file contract:
 * Purpose: `StackraKind`, what a registry item is: the `stackra.kind` of its `package.json`. A missing kind means
 *          `package`; every other kind is named `@<scope>/<kind>-<name>` and installs by `stackra add`.
 * Boundary: an `Enum.of` value plus the type of the same name. The set is exactly ADR 0453 decision 11's; a new kind
 *           needs an ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per registry item kind. */
export const StackraKind = Enum.of({
  /** A built package, installed into `package.json` through pnpm. */
  Package: "package",
  /** A skill folder (`SKILL.md` at the root), installed into `.agents/skills/<name>/`. */
  Skill: "skill",
  /** One agent definition (`agent.md`), installed as `.agents/agents/<name>.md`. */
  Agent: "agent",
  /** An MCP server, installed as an entry of `.mcp.yaml`. */
  Mcp: "mcp",
  /** A plugin folder with its manifest, installed into `.agents/plugins/<name>/`. */
  Plugin: "plugin",
});

/** One of the codes above. */
export type StackraKind = Enum.Value<typeof StackraKind>;

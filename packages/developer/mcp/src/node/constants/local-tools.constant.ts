/**
 * Stackra file contract:
 * Purpose: `LOCAL_TOOLS`, the tools the local `stackra mcp` server offers besides the proxied Encore ones: `manifest`
 *          reads the committed manifests (actions, events, routes, permissions, settings), and `new`, `gen`,
 *          `validate` and `verify` run the CLI command of the same name, so a write passes the CLI's gates.
 * Boundary: data only; each `input` is the zod schema that checks the call and, as JSON Schema, the tool's
 *           `inputSchema`. `serveLocalMcp` dispatches them.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode).
 */
import { z } from "zod";

/** A kind or member name the CLI accepts; never a flag. */
const WORD = z.string().regex(/^[a-z][a-z0-9-]*$/, "A lower-case kebab-case word");

/** Every local tool, by name. */
export const LOCAL_TOOLS = {
  manifest: {
    description:
      "Read the committed stackra.manifest.json of every member (actions, events, routes, permissions, settings, " +
      "models, errors). Filter by member key and narrow to one top-level section.",
    readOnly: true,
    input: z.strictObject({
      member: z.string().optional().describe("A member key, such as `commerce`"),
      section: z.string().optional().describe("A top-level manifest section, such as `actions`"),
    }),
  },
  new: {
    description:
      "Create a member or a kind with `stackra new <kind> <name> [flags]` (service, app, package, module, action, …).",
    readOnly: false,
    input: z.strictObject({
      kind: WORD.describe("What to create, such as `service` or `action`"),
      name: WORD.describe("Its kebab-case name"),
      flags: z
        .array(z.string())
        .optional()
        .describe('Further CLI flags, such as ["--category", "data"]'),
    }),
  },
  gen: {
    description: "Run `stackra gen`; with `check`, fail on drift instead of writing.",
    readOnly: false,
    input: z.strictObject({ check: z.boolean().optional() }),
  },
  validate: {
    description: "Run `stackra validate`, the repository rules, and return its findings.",
    readOnly: true,
    input: z.strictObject({}),
  },
  verify: {
    description:
      "Run `stackra verify`, the full gate (format, lint, typecheck, test, build, validate), and return its output.",
    readOnly: false,
    input: z.strictObject({}),
  },
};

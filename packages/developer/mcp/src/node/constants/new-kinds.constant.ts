/**
 * Stackra file contract:
 * Purpose: `NEW_KINDS`, the kinds the `new` tool offers: exactly the kinds `stackra new` makes (its own templates
 *          `package`, `service` and `seed-pack`, and the scaffold kinds), so the tool's enum never promises a kind the
 *          CLI refuses.
 * Boundary: data only. `@stackra/cli`'s test of `MCP_COMMAND` fails when this list and the CLI's kinds differ.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: create members and kinds); STA-2873.
 */

/** Every kind `stackra new` accepts. */
export const NEW_KINDS = [
  "package",
  "service",
  "seed-pack",
  "tooling",
  "app:console",
  "app:mobile",
  "app:desktop",
  "app:docs",
] as const;

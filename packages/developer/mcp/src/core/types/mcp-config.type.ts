/**
 * Stackra file contract:
 * Purpose: `McpConfig`, a parsed `.mcp.yaml` (and the `.mcp.json` rendered from it): every MCP server the project
 *          uses, by name.
 * Boundary: type only, inferred from `MCP_CONFIG_SCHEMA` so the two cannot drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 9 and 10).
 */
import type { z } from "zod";

import type { MCP_CONFIG_SCHEMA } from "#core/constants/mcp-config-schema.constant";

/** A parsed `.mcp.yaml`. */
export type McpConfig = z.infer<typeof MCP_CONFIG_SCHEMA>;

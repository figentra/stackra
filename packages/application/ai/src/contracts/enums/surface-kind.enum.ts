/**
 * Stackra file contract:
 * Purpose: `SurfaceKind`, what kind of surface opened an AI turn: a screen, an MCP host, a messaging channel or a
 *          background run.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231), carried on `SurfaceDescriptor`. Only a `screen` is
 *           offered client tools (ADR 0490 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 3); STA-1631.
 */
import { Enum } from "@stackra/contracts";

/**
 * A surface's kind.
 *
 * @example
 * if (surface.kind === SurfaceKind.Screen) offerClientTools(table, surface, held);
 */
export const SurfaceKind = Enum.of({
  /** A screen in an app: the sidekick of the console, the mobile staff app or the till. */
  Screen: "screen",
  /** An MCP host (a model client that calls the gateway). */
  McpHost: "mcp_host",
  /** A messaging channel such as WhatsApp or SMS. */
  Messaging: "messaging",
  /** A queued or scheduled run with nobody watching. */
  Background: "background",
});

/** One of the codes above. */
export type SurfaceKind = Enum.Value<typeof SurfaceKind>;

/**
 * Stackra file contract:
 * Purpose: `COMMAND_NAME`, the form of a command name or alias: `[a-z0-9-]` segments joined by `:`.
 * Boundary: a pattern only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-005; spec 030 Glossary (Command Name).
 */

/** A command name such as `tenant:seed` or `db:migrate`. */
export const COMMAND_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*(?::[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

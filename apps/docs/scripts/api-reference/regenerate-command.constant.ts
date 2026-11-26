/**
 * Stackra file contract:
 * Purpose: `REGENERATE_COMMAND`, the command that rewrites the generated API reference, named in every page and in
 *          the drift message.
 * Boundary: a constant only.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/** The command that rewrites the generated pages, named in every page and in the drift message. */
export const REGENERATE_COMMAND = "pnpm --filter @figentra/docs api-reference";

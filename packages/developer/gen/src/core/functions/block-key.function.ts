/**
 * Stackra file contract:
 * Purpose: `blockKey`, the identity of a block: `<member>.<snake(folder)>` (`web.cta_banner`), from the folder its
 *          class sits in, the key a stored document names and `registerBlocks` links.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: widget, block, route); ADR 0270 (decision 3).
 */
import { snakeCase } from "@stackra/support";

/**
 * The key of the block whose class file is `file`, relative to the member root.
 *
 * @example
 * blockKey("web", "src/blocks/cta-banner/cta-banner.block.ts"); // "web.cta_banner"
 */
export function blockKey(member: string, file: string): string {
  return `${member}.${snakeCase(file.split("/").at(-2) ?? "")}`;
}

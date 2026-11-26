/**
 * Stackra file contract:
 * Purpose: `CommandFit`, what a workspace has when `stackra list` shows a command that only some workspaces use:
 *          `mobile` (a mobile app: the root runway's `mobile`, or a member on react-native), `surfaces` (web surfaces
 *          in the root runway), `product` (either), `seed-packs` (a root `seed-packs/` folder), or a package name
 *          (a member is that package or depends on it).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2872 spec FR-002.
 */

/** What a workspace needs for `stackra list` to show a command. */
export type CommandFit = "mobile" | "surfaces" | "product" | "seed-packs" | `@stackra/${string}`;

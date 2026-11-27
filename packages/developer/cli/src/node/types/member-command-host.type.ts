/**
 * Stackra file contract:
 * Purpose: `MemberCommandHost`, one member that declares a console command `stackra` runs at the top level: its root,
 *          its path from the workspace root and the package that contributes the command to it.
 * Boundary: type only; `readMemberCommands` reads it from the committed manifests.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0294 (decision 10: the committed manifest); STA-2888.
 */

/** One member that declares a command. */
export type MemberCommandHost = {
  /** The absolute member root (the folder holding its package.json). */
  readonly root: string;

  /** Its path from the workspace root (`services/orders`); its folder name outside a workspace. */
  readonly label: string;

  /** The package that contributes the command to this member, when a hosted package does. */
  readonly from?: string;
};

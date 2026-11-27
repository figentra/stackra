/**
 * Stackra file contract:
 * Purpose: `MemberCommand`, one console command the workspace members declare in their committed `stackra.manifest.json`
 *          (`commands`), as `stackra <name>` runs it at the top level: its name, the aliases left free, whether it is
 *          hidden, and every member that declares it.
 * Boundary: type only; `readMemberCommands` reads it from the manifests and never runs a member.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6: a member's console); ADR 0294 (decision 10: the committed manifest);
 *                     STA-2888.
 */
import type { MemberCommandHost } from "#node/types/member-command-host.type";

/** A member console command `stackra` runs by its own name. */
export type MemberCommand = {
  /** The command name, `db:status`. */
  readonly name: string;

  /** Its aliases that no `stackra` command and no other member command takes. */
  readonly aliases: readonly string[];

  /** Whether every member that declares it hides it from the list. */
  readonly hidden: boolean;

  /** The members that declare it, sorted by `label`; at least one. */
  readonly hosts: readonly MemberCommandHost[];
};

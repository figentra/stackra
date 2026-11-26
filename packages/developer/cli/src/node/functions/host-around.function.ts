/**
 * Stackra file contract:
 * Purpose: `hostAround(hosts, cwd)`, the member a top-level member command runs in without asking: the only one that
 *          declares it, else the one whose folder holds `cwd` (the person stands in it), else none, and the CLI asks.
 * Boundary: pure; compares paths only.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); STA-2888.
 */
import { isWithin } from "#node/functions/is-within.function";
import type { MemberCommandHost } from "#node/types/member-command-host.type";

/**
 * The host to run in, or undefined when the person must choose.
 *
 * @param hosts - the members that declare the command (at least one).
 * @param cwd - the working directory.
 * @example
 * hostAround([orders, billing], "/repo/services/orders/src"); // orders
 * hostAround([orders, billing], "/repo"); // undefined
 */
export function hostAround(
  hosts: readonly MemberCommandHost[],
  cwd: string,
): MemberCommandHost | undefined {
  if (hosts.length === 1) return hosts[0];
  // Nested members: the deepest folder that holds cwd is the one the person stands in.
  return hosts
    .filter((host) => isWithin(host.root, cwd))
    .toSorted((a, b) => b.root.length - a.root.length)[0];
}

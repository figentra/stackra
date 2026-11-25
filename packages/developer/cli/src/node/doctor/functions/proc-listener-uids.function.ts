/**
 * Stackra file contract:
 * Purpose: `procListenerUids(table, port)`, the owners (user ids) of the TCP sockets listening on `port` in a Linux
 *          `/proc/net/tcp` or `/proc/net/tcp6` table. Every user may read those tables, so the owner of a listener is
 *          known even when its process belongs to someone else.
 * Boundary: pure; parses the text it is given.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */

/** The `st` value of a listening socket. */
const LISTEN = "0A";

/**
 * The user ids that listen on `port`.
 *
 * @param table - the text of `/proc/net/tcp` or `/proc/net/tcp6`.
 * @param port - the TCP port.
 * @example
 * procListenerUids(readFileSync("/proc/net/tcp", "utf8"), 9400); // [1001]
 */
export function procListenerUids(table: string, port: number): number[] {
  const uids: number[] = [];
  for (const line of table.split("\n").slice(1)) {
    // sl local_address rem_address st tx_queue:rx_queue tr:tm->when retrnsmt uid timeout inode
    const fields = line.trim().split(/\s+/);
    const local = fields[1];
    const uid = Number(fields[7]);
    if (local === undefined || fields[3] !== LISTEN || !Number.isInteger(uid)) continue;
    if (Number.parseInt(local.slice(local.lastIndexOf(":") + 1), 16) === port) uids.push(uid);
  }
  return uids;
}

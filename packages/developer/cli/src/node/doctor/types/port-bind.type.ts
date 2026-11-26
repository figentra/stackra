/**
 * Stackra file contract:
 * Purpose: `PortBind`, what binding a port on one address found (`portFree`): free there, busy there, or the address
 *          does not exist on this machine (no IPv6, say), which says nothing about the port.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2794 (a loopback-only listener is busy).
 */

/** The outcome of one bind. */
export type PortBind = "free" | "busy" | "absent";

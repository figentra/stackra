/**
 * Stackra file contract:
 * Purpose: `clientRuntimes`, the client runtimes an app's targets render on: `browser` for web, PWA and the desktop
 *          renderer, `native` for iOS and Android; each gets its own route table, block registrations and entry.
 * Boundary: pure. A member that is not an app renders nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0249 (one app, three targets); ADR 0295 (decisions 7 and 8: an entry per runtime).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The client runtimes of `ir`, browser first.
 *
 * @example
 * clientRuntimes({ ...ir, layout: "app", targets: ["web", "ios"] }); // ["browser", "native"]
 */
export function clientRuntimes(ir: MemberIR): ("browser" | "native")[] {
  if (ir.layout !== "app") return [];
  const targets = ir.targets ?? [];
  return [
    ...(targets.some((target) => target === "web" || target === "pwa" || target === "desktop")
      ? (["browser"] as const)
      : []),
    ...(targets.some((target) => target === "ios" || target === "android")
      ? (["native"] as const)
      : []),
  ];
}

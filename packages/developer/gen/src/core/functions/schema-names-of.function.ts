/**
 * Stackra file contract:
 * Purpose: `schemaNamesOf`, the local name a generated client gives each schema key of a producer's manifest: the
 *          short name, or `<Module><Name>` when two modules share it. `emitClients` declares its constants by it and
 *          `jsonSchemaOf` finds a consumed (remote) base by it, so the two cannot drift (STA-2060).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 2); ADR 0305 (a consumed module is imported by name).
 */
import { pascalCase } from "@stackra/support";

/**
 * The naming function of the schema keys `keys` (`<module>.<Name>`).
 *
 * @param keys - every schema key of one manifest.
 * @example
 * schemaNamesOf(["orders.Line", "billing.Line", "orders.Order"])("orders.Line"); // "OrdersLine"
 */
export function schemaNamesOf(keys: readonly string[]): (key: string) => string {
  const counts = new Map<string, number>();
  for (const key of keys) {
    const name = key.split(".").pop() ?? key;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return (key) => {
    const [module = "", name = key] = key.split(".");
    return (counts.get(name) ?? 0) > 1 ? `${pascalCase(module)}${name}` : name;
  };
}

/**
 * Stackra file contract:
 * Purpose: `integrationKey`, the identity of an Integration: `<module>.<snake(class minus "Integration")>`
 *          (`messages.resend`), the key its connections are stored under and `registerConnections` names.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 19: gen derives the keys); ADR 0294 (decision 20).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The key of an Integration class.
 *
 * @example
 * integrationKey("messages", "ResendIntegration"); // "messages.resend"
 */
export function integrationKey(module: string, className: string): string {
  return `${module}.${snakeCase(className.replace(/Integration$/, ""))}`;
}

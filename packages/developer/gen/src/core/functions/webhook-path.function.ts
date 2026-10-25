/**
 * Stackra file contract:
 * Purpose: `webhookPath`, the inbound webhook URL of an Integration's connections:
 *          `/webhooks/<kebab(module)>/<kebab(class minus "Integration")>/:connectionId`.
 * Boundary: pure. The platform's own account posts to the same path without the connection segment.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 16 and 19: the webhook path is derived and locked); ADR 0224 as amended.
 */
import { kebabCase } from "#core/functions/kebab-case.function";

/**
 * The webhook path of an Integration class.
 *
 * @example
 * webhookPath("messages", "ResendIntegration"); // "/webhooks/messages/resend/:connectionId"
 */
export function webhookPath(module: string, className: string): string {
  return `/webhooks/${kebabCase(module)}/${kebabCase(className.replace(/Integration$/, ""))}/:connectionId`;
}

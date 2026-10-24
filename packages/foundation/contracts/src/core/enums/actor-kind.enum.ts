/**
 * Stackra file contract:
 * Purpose: who can be acting in a call: the `kind` of every `Actor` and the values of an action's `actors` list.
 * Boundary: an `Enum.of` value plus the type of the same name. An action refuses a kind it does not list; the codes
 *           are the manifest's `actors` values and the audit record's actor kind.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decisions 6 and 7: the actor model), ADR 0294 (decision 16), ADR 0231 (snake_case
 *                     codes; 0098's `external-agent` is written `external_agent`).
 */
import { Enum } from "#core/bases/enum.base";

/** The eight actor kinds of ADR 0098. Only a `User` actor has a realm. */
export const ActorKind = Enum.of({
  /** A signed-in person. */
  User: "user",
  /** Another service calling with its service credential. */
  Service: "service",
  /** One of this platform's AI agents. */
  Agent: "agent",
  /** An agent outside the platform, through MCP or A2A with a granted credential. */
  ExternalAgent: "external_agent",
  /** A queued or scheduled run of an action. */
  Job: "job",
  /** A verified inbound webhook. */
  Webhook: "webhook",
  /** The platform itself (migrations, maintenance, retention). */
  System: "system",
  /** A caller without a session, on a public endpoint. */
  Anonymous: "anonymous",
});

/** One of the codes above. */
export type ActorKind = Enum.Value<typeof ActorKind>;

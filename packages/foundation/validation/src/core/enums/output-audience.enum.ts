/**
 * Stackra file contract:
 * Purpose: `OutputAudience`, who reads a serialized record: the public wire, the product's own app, an administrator,
 *          or an agent (a model prompt or tool result). `@Visible({ audience })` names the audiences a field reaches.
 * Boundary: an `Enum.of` value plus the type of the same name. The code is the stored value.
 * Runtime: isomorphic
 * Governing contract: ADR 0095 (decision 6: the serializer audiences `public`, `app`, `admin`, `agent`); ADR 0294
 *                     (decision 6 and R6: serializers are field decorators); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The audiences of the serializer.
 *
 * @example
 * class Customer extends Model { @Visible({ audience: [OutputAudience.Admin] }) note = ""; }
 */
export const OutputAudience = Enum.of({
  /** The public wire: an anonymous or external caller. */
  Public: "public",
  /** The product's own signed-in app. */
  App: "app",
  /** An administrator or support console. */
  Admin: "admin",
  /** An agent: a model prompt, a tool result or an MCP response. */
  Agent: "agent",
});

/** One of the codes above. */
export type OutputAudience = Enum.Value<typeof OutputAudience>;

/**
 * Stackra file contract:
 * Purpose: `AppPublisher`, whose store accounts a mobile build is published under: the platform's own (Figentra's
 *          Apple and Google accounts) or the merchant's, connected as Connections.
 * Boundary: an `Enum.of` value plus the type of the same name. The account keys are runway or tenant data.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 7 and 8).
 */
import { Enum } from "@stackra/contracts";

/** One case per publisher. */
export const AppPublisher = Enum.of({
  /** The platform's own store accounts. */
  Platform: "platform",
  /** The merchant's store accounts, connected as Connections. */
  Merchant: "merchant",
});

/** One of the codes above. */
export type AppPublisher = Enum.Value<typeof AppPublisher>;

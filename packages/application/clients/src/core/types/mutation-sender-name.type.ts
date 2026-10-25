/**
 * Stackra file contract:
 * Purpose: `MutationSenderName`, the driver names of `@stackra/query`'s `MutationSender` port (`client`), registered under
 *          its port key `query.MutationSender`, because this package ships the port's only driver.
 * Boundary: a type and the `DriverRegistry` augmentation; `@stackra/query` declares no names for the port, so this is
 *           the one declaration of the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0059 (offline queue).
 */

/** The drivers of `MutationSender`. */
export type MutationSenderName = "client";

declare module "@stackra/container" {
  interface DriverRegistry {
    "query.MutationSender": MutationSenderName;
  }
}

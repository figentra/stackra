/**
 * Stackra file contract:
 * Purpose: `producerBaseUrl`, the base URL a call to a versioned key goes to: the URL configured for the key's module
 *          (`orders` of `orders.order.cancel@1`) in `ClientsOptions.producers`, else the one API `baseUrl`.
 * Boundary: pure; reads only the options it is given. A key whose module is not listed, a generated or a dynamic one,
 *           goes to `baseUrl`, so a host with one gateway configures nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 6, and the 2026-10-26 note on dynamic keys); ADR 0146 (config classes).
 */
import type { ClientsOptions } from "#core/schemas/clients-options.schema";

/**
 * The base URL of the producer of `key`.
 *
 * @example
 * producerBaseUrl("orders.order.cancel@1", { baseUrl: "", producers: { orders: "https://orders.internal" } });
 * // "https://orders.internal"
 */
export function producerBaseUrl(
  key: string,
  options: Pick<ClientsOptions, "baseUrl" | "producers">,
): string {
  const module = key.split(".", 1)[0] ?? "";
  // Own keys only, so a key like `constructor.x.y@1` never reads an inherited property.
  return Object.hasOwn(options.producers, module)
    ? (options.producers[module] ?? options.baseUrl)
    : options.baseUrl;
}

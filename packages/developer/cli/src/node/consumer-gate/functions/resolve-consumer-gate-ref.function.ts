/**
 * Stackra file contract:
 * Purpose: `resolveConsumerGateRef(product, services)`, the one commit a run's checkout must be at: the product's
 *          `ref`, or the common pin of the services being gated. Services pinned to different commits cannot share
 *          a checkout, so they are gated one pin at a time with `--services`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";

/**
 * The commit to check the checkout against, or the reason there is none.
 *
 * @param product - the matrix entry.
 * @param services - the services this run gates.
 * @example
 * resolveConsumerGateRef({ repo: "a/b", pins: { x: "111", y: "222" }, services: ["x", "y"] }, ["x"]); // { ref: "111" }
 */
export function resolveConsumerGateRef(
  product: ConsumerGateProduct,
  services: readonly string[],
): { readonly ref: string } | { readonly error: string } {
  if (product.ref !== undefined) return { ref: product.ref };
  const pins = [...new Set(services.map((service) => product.pins?.[service] ?? ""))];
  if (pins.includes("")) {
    return { error: `no pin for a service among ${services.join(", ")}` };
  }
  if (pins.length > 1) {
    return {
      error: `services ${services.join(", ")} are pinned to different commits (${pins.join(", ")}); gate one pin at a time with --services`,
    };
  }
  return { ref: pins[0] as string };
}

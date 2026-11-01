/**
 * Stackra file contract:
 * Purpose: `loadConsumerGateMatrix(text)`, the matrix file validated: `products.<name>` has `repo`, exactly one of
 *          `ref` (one commit) and `pins` (a commit per service, covering every service), a non-empty `services`
 *          list, optional `overlays` and optional known `steps`.
 * Boundary: pure; throws an `Error` naming the product on a bad shape.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { parse } from "yaml";

import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";

/**
 * Parses and validates the matrix.
 *
 * @param text - the YAML of `matrix.yaml`.
 * @example
 * loadConsumerGateMatrix("products:\n  pay:\n    repo: a/pay\n    ref: abc1234\n    services: [payments]\n");
 */
export function loadConsumerGateMatrix(text: string): Record<string, ConsumerGateProduct> {
  const products = (parse(text) as { products?: Record<string, ConsumerGateProduct> } | null)
    ?.products;
  if (!products || typeof products !== "object") throw new Error("matrix: `products` is missing");
  for (const [name, product] of Object.entries(products)) {
    if (product.kind === "scaffold") {
      if (typeof product.fixture !== "string" || !Array.isArray(product.services)) {
        throw new TypeError(
          `matrix: ${name} (scaffold) needs a fixture folder and a services list`,
        );
      }
      continue;
    }
    const hasRef = typeof product.ref === "string";
    const hasPins = product.pins !== undefined && typeof product.pins === "object";
    if (typeof product.repo !== "string" || hasRef === hasPins) {
      throw new Error(`matrix: ${name} needs repo and ref (or pins, not both)`);
    }
    if (!Array.isArray(product.services) || product.services.length === 0) {
      throw new Error(`matrix: ${name} needs a non-empty services list`);
    }
    for (const service of product.services) {
      if (hasPins && typeof product.pins?.[service] !== "string") {
        throw new Error(`matrix: ${name} has no pin for service ${service}`);
      }
    }
    for (const step of product.steps ?? []) {
      if (!CONSUMER_GATE_STEPS.includes(step)) {
        throw new Error(`matrix: ${name} names unknown step ${step}`);
      }
    }
  }
  return products;
}

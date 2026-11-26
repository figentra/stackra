/**
 * Stackra file contract:
 * Purpose: `loadConsumerGateMatrix(text)`, the matrix file validated: `products.<name>` has `repo`, exactly one of
 *          `ref` (one commit) and `pins` (a commit per service, covering every service), a non-empty `services`
 *          list, optional `overlays`, optional known `steps` and an optional `pinned` date (`YYYY-MM-DD`). A
 *          `kind: scaffold` entry has `repo` and `ref` (the starter template), a `fixture` folder, the `service` the
 *          fixture goes into (listed in `services`), no `pins`, no `overlays` and no `mode` but `pack`.
 * Boundary: pure; throws an `Error` naming the product on a bad shape.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813; STA-2705.
 */
import { parse } from "yaml";

import { CONSUMER_GATE_STEPS } from "#node/consumer-gate/constants/consumer-gate-steps.constant";
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";

/** A calendar date, `YYYY-MM-DD`. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Throws when a scaffold entry is malformed. */
function checkScaffold(name: string, product: ConsumerGateProduct): void {
  if (
    typeof product.fixture !== "string" ||
    typeof product.repo !== "string" ||
    typeof product.ref !== "string" ||
    product.pins !== undefined
  ) {
    throw new TypeError(
      `matrix: ${name} (scaffold) needs a fixture folder, and repo and ref naming its starter (no pins)`,
    );
  }
  if (typeof product.service !== "string" || !product.services.includes(product.service)) {
    throw new Error(
      `matrix: ${name} (scaffold) needs the service it adds for the fixture, listed in services`,
    );
  }
  if ((product.overlays?.length ?? 0) > 0) {
    throw new Error(
      `matrix: ${name} (scaffold) holds every service it gates; it takes no overlays`,
    );
  }
  if (product.mode !== undefined && product.mode !== "pack") {
    throw new Error(`matrix: ${name} (scaffold) installs packed tarballs; its mode is pack`);
  }
}

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
    if (!Array.isArray(product.services) || product.services.length === 0) {
      throw new Error(`matrix: ${name} needs a non-empty services list`);
    }
    const pinned: unknown = product.pinned;
    if (
      pinned !== undefined &&
      (typeof pinned !== "string" || !DATE.test(pinned) || Number.isNaN(Date.parse(pinned)))
    ) {
      throw new Error(`matrix: ${name} has pinned ${String(pinned)}; write the date as YYYY-MM-DD`);
    }
    for (const step of product.steps ?? []) {
      if (!CONSUMER_GATE_STEPS.includes(step)) {
        throw new Error(`matrix: ${name} names unknown step ${step}`);
      }
    }
    if (product.kind === "scaffold") {
      checkScaffold(name, product);
      continue;
    }
    const hasRef = typeof product.ref === "string";
    const hasPins = product.pins !== undefined && typeof product.pins === "object";
    if (typeof product.repo !== "string" || hasRef === hasPins) {
      throw new Error(`matrix: ${name} needs repo and ref (or pins, not both)`);
    }
    for (const service of product.services) {
      if (hasPins && typeof product.pins?.[service] !== "string") {
        throw new Error(`matrix: ${name} has no pin for service ${service}`);
      }
    }
  }
  return products;
}

/**
 * Stackra file contract:
 * Purpose: `validateConsumerGateSetup(options, deps)`, every precondition of a run, as an `Error` naming the first
 *          that fails (the runner turns it into exit 2): a known product name (`[a-z0-9-]+`, own key of the matrix),
 *          a `product` kind (`scaffold` is not yet supported), `--services` inside the product's services, one
 *          hex pin the checkout's HEAD is at, `--overlays` when the product has overlays, a core tree with
 *          `packages/` and a build (`dist` folder under `<core>/packages/<category>/<name>`), a checkout with `pnpm-workspace.yaml` and each
 *          service's `package.json`, and an `--out` inside neither tree. Resolves with the run's key and mode.
 * Boundary: reads folders and creates `--out`; writes nothing else.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import { existsSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import { join, sep } from "node:path";

import { resolveConsumerGateRef } from "#node/consumer-gate/functions/resolve-consumer-gate-ref.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";
import type { ConsumerGateMode } from "#node/consumer-gate/types/consumer-gate-mode.type";
import type { ConsumerGateOptions } from "#node/consumer-gate/types/consumer-gate-options.type";
import type { ConsumerGateProduct } from "#node/consumer-gate/types/consumer-gate-product.type";

/** The build a core tree needs before a gate run, run by the caller in the core tree. */
const CORE_BUILD =
  "pnpm install --frozen-lockfile && pnpm exec turbo run build --filter=./packages/**";

const folders = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const hasBuild = (core: string): boolean =>
  folders(join(core, "packages")).some((category) =>
    folders(join(core, "packages", category)).some((pack) =>
      existsSync(join(core, "packages", category, pack, "dist")),
    ),
  );

const inside = (path: string, parent: string): boolean =>
  path === parent || path.startsWith(parent + sep);

/**
 * Checks the setup.
 *
 * @param options - the resolved run input.
 * @param deps - the outside world (`head`).
 * @example
 * validateConsumerGateSetup(options, deps); // { spec, services, ref, sha, key, mode }
 */
export function validateConsumerGateSetup(
  options: ConsumerGateOptions,
  deps: ConsumerGateDeps,
): {
  readonly spec: ConsumerGateProduct;
  readonly services: readonly string[];
  readonly ref: string;
  readonly sha: string | undefined;
  readonly key: string;
  readonly mode: ConsumerGateMode;
} {
  const { product, core, checkout, out } = options;
  if (!/^[a-z0-9-]+$/.test(product) || !Object.hasOwn(options.matrix, product)) {
    throw new Error(`unknown product ${product}`);
  }
  const spec = options.matrix[product] as ConsumerGateProduct;
  if (spec.kind === "scaffold") {
    throw new Error(
      `product ${product}: kind scaffold is not yet supported (the fixture and matrix entry exist; the temp-workspace runner does not)`,
    );
  }
  const services = options.services ?? spec.services;
  const unknown = services.filter((service) => !spec.services.includes(service));
  if (unknown.length > 0) throw new Error(`${product} has no service ${unknown.join(", ")}`);
  const pin = resolveConsumerGateRef(spec, services);
  if ("error" in pin) throw new Error(pin.error);
  if (!/^[0-9a-f]{7,40}$/.test(pin.ref)) {
    throw new Error(`the pin ${pin.ref} is not a commit SHA (7 to 40 hex digits)`);
  }
  const sha = deps.head(checkout);
  if (!sha?.startsWith(pin.ref)) {
    throw new Error(`checkout is at ${sha}, the matrix pins ${pin.ref}`);
  }
  if ((spec.overlays?.length ?? 0) > 0 && options.overlays === undefined) {
    throw new Error(
      `${product} has overlays (${spec.overlays?.join(", ")}): pass --overlays <dir>`,
    );
  }
  if (!existsSync(join(core, "packages")) || !existsSync(checkout)) {
    throw new Error(`no core packages/ under ${core}, or no checkout at ${checkout}`);
  }
  if (!hasBuild(core)) {
    throw new Error(
      `core is not built (no dist under ${core}/packages); the gate never writes the core tree: run \`${CORE_BUILD}\` in it first`,
    );
  }
  if (!existsSync(join(checkout, "pnpm-workspace.yaml"))) {
    throw new Error(`the checkout has no pnpm-workspace.yaml: ${checkout}`);
  }
  for (const service of services) {
    if (!existsSync(join(checkout, "services", service, "package.json"))) {
      throw new Error(`service ${service} is not in the checkout at ${pin.ref}`);
    }
  }
  mkdirSync(out, { recursive: true });
  const realOut = realpathSync(out);
  if (inside(realOut, realpathSync(checkout)) || inside(realOut, realpathSync(core))) {
    throw new Error(`--out ${out} is inside the checkout or the core tree`);
  }
  const narrowed = options.services === undefined ? "" : `~${services.join(",")}`;
  return {
    spec,
    services,
    ref: pin.ref,
    sha,
    key: `${product}@${pin.ref}${narrowed}`,
    mode: options.mode ?? spec.mode ?? "link",
  };
}

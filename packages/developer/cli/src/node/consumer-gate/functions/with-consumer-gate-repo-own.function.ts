/**
 * Stackra file contract:
 * Purpose: `withConsumerGateRepoOwn(input, run)`, the repo-own window: the checkout's own `pnpm-workspace.yaml` and
 *          `pnpm-lock.yaml` are copied back into the scratch copy and the overlay-only `services/<x>` folders are moved
 *          to `aside`, `run` is called, and in a `finally` the linked workspace, the installed lockfile and the
 *          overlay folders are put back.
 * Boundary: writes only inside the scratch copy and `aside` (both under `--out`); reads the checkout.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const FILES = ["pnpm-workspace.yaml", "pnpm-lock.yaml"];

/**
 * Runs `run` with the product's own workspace, lockfile and services.
 *
 * @param input - the scratch copy `root`, the `checkout`, the `aside` folder and the `overlayOnly` service names.
 * @param run - the work to do inside the window.
 * @example
 * withConsumerGateRepoOwn({ root, checkout, aside, overlayOnly: ["tenancy"] }, () => exec(validate));
 */
export function withConsumerGateRepoOwn<T>(
  input: {
    readonly root: string;
    readonly checkout: string;
    readonly aside: string;
    readonly overlayOnly: readonly string[];
  },
  run: () => T,
): T {
  const { root, checkout, aside, overlayOnly } = input;
  const saved = FILES.map(
    (file) =>
      [file, existsSync(join(root, file)) ? readFileSync(join(root, file)) : undefined] as const,
  );
  mkdirSync(aside, { recursive: true });
  const moved = overlayOnly.filter((service) => existsSync(join(root, "services", service)));
  try {
    for (const service of moved) {
      rmSync(join(aside, service), { recursive: true, force: true });
      renameSync(join(root, "services", service), join(aside, service));
    }
    for (const file of FILES) {
      if (existsSync(join(checkout, file))) cpSync(join(checkout, file), join(root, file));
      else rmSync(join(root, file), { force: true });
    }
    return run();
  } finally {
    for (const [file, content] of saved) {
      if (content === undefined) rmSync(join(root, file), { force: true });
      else writeFileSync(join(root, file), content);
    }
    for (const service of moved) renameSync(join(aside, service), join(root, "services", service));
  }
}

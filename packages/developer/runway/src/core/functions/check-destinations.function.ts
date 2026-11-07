/**
 * Stackra file contract:
 * Purpose: `checkDestinations(root)`, the driver check of a parsed root runway (owner decision O8, 2026-11-04): every
 *          `environments.<env>.destinations` value must be a destination runway drives, and every `targets.<name>`
 *          block a driven destination or one of the non-destination blocks (`DRIVEN_TARGETS`). `compose`, `aws-ecs`,
 *          `helm`, a desktop `electron-release` destination and the dev servers (`vite-dev`, `expo-dev`, `mint-dev`)
 *          have no driver, so a deploy naming them would fail late.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print with the file.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 1); ADR 0296 (enforcement); STA-2100.
 */
import { DRIVEN_TARGETS } from "#core/constants/driven-targets.constant";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * Every destination and target block of `root` that no driver serves; `[]` when each is driven.
 *
 * @param root - the parsed root runway.
 * @example
 * checkDestinations(root);
 * // [{ path: "environments.dev.destinations.services", message: "No driver ships to compose: …" }]
 */
export function checkDestinations(root: RootRunway): RunwayIssue[] {
  const driven = new Set<string>(DRIVEN_TARGETS.destinations);
  const known = new Set<string>([...driven, ...DRIVEN_TARGETS.blocks]);
  const names = DRIVEN_TARGETS.destinations.join(", ");
  const destinations = Object.entries(root.environments).flatMap(([environment, block]) =>
    Object.entries(block?.destinations ?? {})
      .filter(([, destination]) => !driven.has(destination))
      .map(([kind, destination]) => ({
        path: `environments.${environment}.destinations.${kind}`,
        message: `No driver ships to ${destination}: use one of ${names}, or remove the line until a driver exists`,
      })),
  );
  const blocks = Object.keys(root.targets ?? {})
    .filter((name) => !known.has(name))
    .map((name) => ({
      path: `targets.${name}`,
      message: `No driver reads targets.${name}: remove the block until a driver exists (${names})`,
    }));
  return [...destinations, ...blocks];
}

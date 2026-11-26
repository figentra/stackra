/**
 * Stackra file contract:
 * Purpose: `StackraEnvironment`, the closed list of environments a Stackra process runs as: the only values
 *          `STACKRA_ENVIRONMENT` may hold and the only answers `readEnvironment` gives (STA-2844).
 * Boundary: an `Enum.of` value plus the type of the same name. A name outside the list (`prod`, a typo) fails
 *           `readEnvironment` and boot; it never reads as an environment that relaxes a check.
 * Runtime: isomorphic
 * Governing contract: ADR 0170 (decision 5: the environments a release is promoted through); ADR 0296 (amendment
 *                     2026-11-26: the environment comes from the runtime only); ADR 0294 (decision 16: Enum); STA-2844.
 */
import { Enum } from "@stackra/contracts";

/** The environments, from a developer's machine to customers. */
export const StackraEnvironment = Enum.of({
  /** A developer's machine (`stackra dev`, `encore run`); dev-only drivers and dev sign-in are allowed here. */
  Dev: "dev",
  /** An automated test run (`encore test`, vitest); memory drivers are allowed here. */
  Test: "test",
  /** One deployment per pull request. */
  Preview: "preview",
  /** The pre-production environment every merge to main reaches. */
  Staging: "staging",
  /** The environment customers use, reached by promotion. */
  Production: "production",
});

/** One of the codes above. */
export type StackraEnvironment = Enum.Value<typeof StackraEnvironment>;

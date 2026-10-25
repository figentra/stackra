/**
 * Stackra file contract:
 * Purpose: who can see the repository, as the root runway's `providers.github.visibility` states it and GitHub's
 *          repository `visibility` field takes it.
 * Boundary: an `Enum.of` value plus the type of the same name. The plan defaults to `private`, so a repository the
 *           runway does not mark public is never opened by a mistake.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 2: `@stackra/infra-github`); ADR 0072 (decision 2: push protection).
 */
import { Enum } from "@stackra/contracts";

/** Repository visibility. */
export const GithubVisibility = Enum.of({
  /** Anyone can read it; GitHub's secret scanning and push protection are free and switched on. */
  Public: "public",
  /** Only the people and teams given access can read it (the default). */
  Private: "private",
  /** Every member of the enterprise can read it (GitHub Enterprise only). */
  Internal: "internal",
});

/** One of the values above. */
export type GithubVisibility = Enum.Value<typeof GithubVisibility>;

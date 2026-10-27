/**
 * Stackra file contract:
 * Purpose: `InfraGithubConfig$`, the shipped schema of `InfraGithubOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraGithubOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraGithubOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraGithubConfig$`. */
export const InfraGithubConfig$ = z.object({
  api: z
    .string()
    .regex(/^https:\/\/\S+$/, "Expected an https:// URL")
    .default("https://api.github.com/"),
});

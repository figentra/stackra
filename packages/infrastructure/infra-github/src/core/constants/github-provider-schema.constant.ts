/**
 * Stackra file contract:
 * Purpose: `GITHUB_PROVIDER_SCHEMA`, the root runway's `providers.github` block: the org and repository, its
 *          visibility, its description, topics and homepage (the repository metadata standard), the repository Actions
 *          variables, and the deployment environments with their reviewers, the
 *          branch and tag patterns that may deploy to them and their own variables.
 * Boundary: internal; `githubPlan` reads the block with it. The root runway schema keeps the block open, and this
 *           package, its one reader, checks it strictly, so a misspelt key fails `stackra infra gen`. Values are
 *           public names, ids or `ref:<path>`; never a secret value (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 2), ADR 0170 (decision 6: production behind a GitHub environment), ADR 0284
 *                     (decisions 6 and 7: the `static` environment and the CI identity variable),
 *                     ADR 0231 (SCREAMING_SNAKE; `GITHUB_` is GitHub's).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { GithubVisibility } from "#core/enums/github-visibility.enum";

/** Actions variables: name → public value or `ref:<path>`, kept as text because GitHub stores text. */
const VARIABLES = z.record(
  z
    .string()
    .regex(
      /^(?!GITHUB_)[A-Z][A-Z0-9_]*$/,
      "Expected a SCREAMING_SNAKE name outside GitHub's reserved GITHUB_ prefix",
    ),
  z.union([z.string(), z.number(), z.boolean()]).transform(String),
);

/** Branch or tag name patterns (`main`, `schemas@*`). */
const PATTERNS = z.array(z.string().min(1)).min(1, "List at least one pattern, or leave it out");

/** One deployment environment. */
const ENVIRONMENT = z.strictObject({
  reviewers: z
    .array(
      z
        .string()
        .regex(
          /^[A-Za-z0-9-]+(?:\/[A-Za-z0-9._-]+)?$/,
          "Expected a user login or <org>/<team-slug>",
        ),
    )
    .max(6, "GitHub allows six reviewers per environment")
    .optional(),
  branches: PATTERNS.optional(),
  tags: PATTERNS.optional(),
  variables: VARIABLES.optional(),
});

/** A GitHub topic: lower case, digits and hyphens, at most 50 characters (GitHub's own rule). */
const TOPIC = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,49}$/,
    "Expected a lower-case GitHub topic of at most 50 characters",
  );

/** The `providers.github` block. */
export const GITHUB_PROVIDER_SCHEMA = z.strictObject({
  org: z
    .string()
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/, "Expected a GitHub organisation login"),
  repo: z.string().regex(/^[A-Za-z0-9._-]+$/, "Expected a GitHub repository name"),
  visibility: z
    .enum(Enum.values(GithubVisibility) as [GithubVisibility, ...GithubVisibility[]])
    .default(GithubVisibility.Private),
  description: z.string().trim().min(1).max(350, "GitHub allows 350 characters").optional(),
  topics: z
    .array(TOPIC)
    .max(20, "GitHub allows 20 topics")
    .refine((topics) => new Set(topics).size === topics.length, "List each topic once")
    .optional(),
  homepage: z.string().url("Expected an absolute URL").optional(),
  variables: VARIABLES.optional(),
  environments: z
    .record(
      z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case environment name"),
      ENVIRONMENT,
    )
    .optional(),
});

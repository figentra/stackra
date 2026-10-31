/**
 * Stackra file contract:
 * Purpose: the fixtures of the `runway` binary's tests: a root runway with three targets and their caller workflows,
 *          two member runways, two SHAs and a git stand-in.
 * Boundary: test only; never exported from an entry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import type { DeployRunways } from "#node/types/deploy-runways.type";

/** A root runway. */
export const ROOT_RUNWAY = {
  version: 3,
  project: "acme",
  providers: {
    github: { org: "acme", repo: "platform" },
    infisical: {
      environments: { production: "prod" },
      paths: { runtime: "/runtime", ci: "/ci" },
    },
  },
  environments: {
    production: { destinations: { web: "cloudflare-workers", docs: "mintlify" } },
  },
  targets: {
    "cloudflare-workers": { workflows: { web: "deploy-web.yml", static: "deploy-static.yml" } },
    mintlify: { workflows: { docs: "deploy-docs.yml" } },
    npm: { workflows: { packages: "release.yml" } },
  },
  secrets: { sync: "on-deploy", defaultPath: "runtime", ci: ["CLOUDFLARE_API_TOKEN"] },
  release: { buildOrder: ["npm", "cloudflare-workers", "encore-cloud", "mintlify"] },
};

/** Two member runways: one with a secret and a var, one with neither. */
export const MEMBERS: DeployRunways["members"] = [
  {
    member: "web",
    runway: {
      secrets: ["SENTRY_AUTH"],
      environments: {
        production: {
          vars: { VITE_API_ORIGIN: "https://api.acme.example" },
          secrets: ["SENTRY_AUTH"],
        },
      },
    },
  },
  { member: "docs", runway: { environments: { dev: {} } } },
];

/** The head of origin/main, and an older commit of it. */
export const MAIN = "a".repeat(40);
export const OLD = "b".repeat(40);

/** A git stand-in: `answers[args.join(" ")]` is stdout, an Error is thrown, anything missing throws. */
export const fakeGit =
  (answers: Readonly<Record<string, string | Error>>) =>
  (args: readonly string[]): string => {
    const answer = answers[args.join(" ")];
    if (answer === undefined || answer instanceof Error) throw answer ?? new Error(args.join(" "));
    return answer;
  };

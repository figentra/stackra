# @stackra/infra-github

GitHub as code (ADR 0171 decision 2): the repository plan read from the root runway (settings, deployment environments
with their reviewers and deploy refs, Actions variables, the CI secret names), the committed rulesets and branch
protection checked before anything is applied, and the Pulumi slice that applies them and pins the OIDC subject CI
trusts. It reads the root runway, so no org, repository or reviewer is typed twice.

**Tier:** `tier:lib` (`packages/infrastructure/infra-github`). Entries `.` (isomorphic: the plan and the checks) and
`./node` (the file reader and the Pulumi slice). Depends on `@stackra/contracts`, `@stackra/runway`, zod,
`@pulumi/github` and `@pulumi/pulumi`.

Agents never run `pulumi` and never call GitHub. The program runs in the private stacks repository (`figentra/infra`,
ADR 0289 decision 9), where the owner runs `pulumi up`; here it is tested under Pulumi's mocks.

## What is here

| Entry    | Symbol                                                                                          | Use                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.`      | `githubPlan(root)`                                                                              | the repository as code from the root runway's `providers.github`              |
| `.`      | `parseRuleset(document, source?)`                                                               | one committed `.github/rulesets/<name>.json`, checked                         |
| `.`      | `parseBranchProtection(document, source?)`                                                      | the committed `.github/branch-protection.json`, checked                       |
| `.`      | `GithubVisibility`                                                                              | enum: `public`, `private` (the default), `internal`                           |
| `.`      | `GithubInfraInvalidError`                                                                       | every input failure, with its source and each path                            |
| `.`      | `GithubHealthIndicatorDriver`                                                                   | the `HealthIndicator` driver: the GitHub API answers                          |
| `.`      | `GithubPlan`, `GithubEnvironment`, `GithubRules`, `RulesetDocument`, `BranchProtectionDocument` | types                                                                         |
| `./node` | `readGithubRules(directory)`                                                                    | every `rulesets/*.json` and `branch-protection.json` under a `.github` folder |
| `./node` | `githubStack(plan, rules, config?)`                                                             | the whole GitHub slice in one call; returns the repository and the CI secrets |
| `./node` | `GithubStack`                                                                                   | type                                                                          |

## The input

The root runway's `providers.github` block (the schema is strict, so a misspelt key fails before anything is planned):

```yaml
providers:
  github:
    org: figentra
    repo: stackra
    visibility: private # the default; public turns on secret scanning and push protection
    variables:
      INFISICAL_CI_IDENTITY_ID: ref:infisical.ciIdentity # public ids only; never a secret name
    environments:
      production:
        reviewers: [figentra/owners, akouta] # a user login or <org>/<team-slug>, six at most
      release:
        tags: ["*@*"]
environments:
  staging:
    deploy: { on: push }
```

One GitHub environment exists per runway environment that deploys (never `dev`) and per environment the block names.
A pull-request preview may deploy from any ref, everything else from `main` unless the block names its branches or tags.
An environment promoted behind `deploy.approval: github-environment` names who approves. The Infisical domain and project
from `providers.infisical` become repository variables; the root runway's `secrets.ci` names are carried as names only.

## Using it

```ts
// figentra/infra: github/index.ts
import { githubPlan } from "@stackra/infra-github";
import { githubStack, readGithubRules } from "@stackra/infra-github/node";
import { readRunway } from "@stackra/runway/node";

const github = githubStack(
  githubPlan(readRunway("runway.yaml", "root")),
  readGithubRules(".github"),
);

export const repository = github.repository;
```

`ref:<key>.<path>` reads the project config key `<key>` and walks `<path>` into it, as `@stackra/infra-aws` does. An
unset one fails the program before any resource is planned.

## What the slice declares

| Resource              | Detail                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Repository            | squash merges only, the commit messages kept, branches deleted on merge; protected and retained on delete         |
| Security              | secret scanning and push protection, on a public repository                                                       |
| OIDC subject template | GitHub's default `repo:<org>/<repo>:environment:<env>`, which the cloud roles and the Infisical CI identity trust |
| Environments          | reviewers (teams and users), custom deploy branch and tag policies, and each one's variables                      |
| Actions variables     | the repository's and each environment's; no Actions secret is ever created                                        |
| Rulesets              | every committed `.github/rulesets/*.json`, in file name order                                                     |
| Branch protection     | the committed `.github/branch-protection.json`, when there is one                                                 |

## Owner steps

- Run `pulumi up` in `figentra/infra` after reviewing the preview (ADR 0171).
- Import an existing repository once before the first `up`; the program never deletes it.
- Provide the provider's token as `GITHUB_TOKEN` in the environment; it never passes through code.
- A private repository needs GitHub's paid secret protection before its secret scanning can be switched on.

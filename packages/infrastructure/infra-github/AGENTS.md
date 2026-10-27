# AGENTS — @stackra/infra-github

GitHub as code (ADR 0171 decision 2): the repository plan from the root runway, the committed rulesets and branch
protection, and the Pulumi slice that applies them. Member at `packages/infrastructure/infra-github` (`tier:lib`).
Entries `.` (isomorphic plan and checks) and `./node` (the file reader and the Pulumi slice).

## Where code goes

| You are writing…                           | It goes in…                                 |
| ------------------------------------------ | ------------------------------------------- |
| A zod schema of an input (internal)        | `src/core/constants/<name>.constant.ts`     |
| An enum                                    | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| A pure check or planner (no Pulumi import) | `src/core/functions/<name>.function.ts`     |
| A function that declares Pulumi resources  | `src/node/functions/<name>.function.ts`     |
| A function that reads files                | `src/node/functions/<name>.function.ts`     |
| A test                                     | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- Never run `pulumi` (preview, up, destroy, import) or call the GitHub API: the owner runs the stacks in
  `figentra/infra`. Test the slice under Pulumi's mocks.
- Decide in `src/core/` and declare in `src/node/`: a rule that can be checked without Pulumi is a core function with
  its own test.
- GitHub holds variables (ids) only, never a secret value or an Actions secret: CI reads secrets from Infisical over
  OIDC (ADR 0173). A variable that carries a CI or gateway secret's name is an error.
- The repository is protected and retained on delete. The provider's token comes from `GITHUB_TOKEN`, never from code.
- An environment's name is the OIDC subject CI's cloud roles trust; renaming one changes who may assume a role.
- `ref:` values name an id, never a secret; `resolveRef` stays internal to `./node`.
- A ruleset setting the provider cannot apply while it is on fails `parseRuleset`; keep the checks in step with the
  provider's schema.
- The health driver's target is `InfraGithubConfig` (`src/config/infra-github.config.ts`, key `infra_github`), injected by type:
  the runway's `config.infra_github` sets it. Never a constructor options object (gen's `token_not_a_class`).

## PII

None. The inputs are an organisation, a repository, reviewer logins and team slugs, variable names and ids; no
secret value. Reviewer logins are public GitHub handles.

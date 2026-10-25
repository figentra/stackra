---
"@stackra/infra-github": minor
---

Add `@stackra/infra-github`, GitHub as code (ADR 0171): `githubPlan` reads the repository, its Actions variables, the
deployment environments with their reviewers and deploy refs, and the CI secret names from the root runway;
`parseRuleset` and `parseBranchProtection` check the committed rules; `readGithubRules` and `githubStack` (`./node`)
read them and apply the whole slice (squash-only settings, push protection on a public repository, the OIDC subject
CI trusts, environments, variables, rulesets and branch protection) without ever creating an Actions secret.

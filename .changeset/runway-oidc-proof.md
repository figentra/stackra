---
"@stackra/runway": minor
"@stackra/cli": minor
---

Approvals and "CI only" are proved, never asserted (STA-2099 item 4). `proveGithubJob` asks the GitHub
Actions runner for an OIDC token (audience `stackra-runway`), checks GitHub's RS256 signature, the issuer,
the expiry and the repository, and, for an approval, that the job runs in that runway environment or in a
GitHub environment `providers.github.environments` declares with reviewers. The deploy, promote and
product deploy commands prove an environment's `deploy.approval` with it; `--approved` is still parsed
and proves nothing. Reading runtime secrets from Infisical and `stackra mobile onboard --check|--live`
need the proof instead of `GITHUB_ACTIONS=true`. A job needs `permissions: id-token: write`.

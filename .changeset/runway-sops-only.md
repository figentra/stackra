---
"@stackra/runway": minor
"@stackra/cli": minor
"@stackra/infra-github": patch
---

Runway no longer reads Infisical (ADR 0525). The secret sync (`runway secrets sync`, and `stackra deploy` with
`secrets.sync: on-deploy`) and the Workers provider read every declared secret from the job's environment, where
`.github/actions/secrets-decrypt` put the product's sops scope. `--from-env` is still accepted on both commands but does
nothing and prints a deprecation note; it goes in the next minor release.

- A product's runtime secrets live in the scope `products/<project>/<dev|staging|production>`; a preview reads dev's.
  `deployPlan` gives `secretScope` in place of `infisicalEnvironment`, and a `SecretSyncEntry` gives `scope` in place
  of `path`. The secret entries of `deployPlan(...).sync` no longer carry a `path`.
- `providers.infisical` is no longer typed in the root schema, and `secrets.defaultPath` is ignored. A runway.yaml that
  still has either passes validation, and `runway validate` warns on each for one release: remove them.
- `runway env check` checks each name against the sops scope of its environment, and counts the `names:` of a
  `secrets-decrypt` step as declared, in place of Infisical `secret-name:` steps. Names only, no login.
- `runway env check --values --env <env>` reads the values from the job's environment and checks only that
  environment; `--project-id` is gone.
- `runway env orphans <env> [--dir <d>]` lists the scope's names from its ciphertext file names, decrypting nothing;
  `--project-id` is gone.
- `readMemberSecrets` takes `env` and no longer takes `source` or `run`. `syncSecrets` no longer takes `fromEnv`.
- infra-github still sets the `INFISICAL_DOMAIN` and `INFISICAL_PROJECT_ID` variables from an untyped
  `providers.infisical` block while CI logins need them.

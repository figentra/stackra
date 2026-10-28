---
"@stackra/runway": minor
---

Add preview databases per pull request (ADR 0238 decision 1). `previewDatabaseOf(root, branch)` reads
`environments.preview.shared.database` (`from: seed-pack | branch`, `profile`, `branch: { provider: neon, project,
parent }`): by default a fresh database seeded with `previewSeedStep` (`stackra seed-pack <product> --profile demo --env
preview`); with `from: branch` a Neon branch `preview-<git branch>`. New `PreviewDatabaseBrancher` port and
`PreviewDatabaseSource` enum in `.`, and `NeonPreviewDatabaseDriver` in `./node`, which creates, connects to and deletes
the branch with `neonctl`.

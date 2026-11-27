---
"@stackra/cli": minor
---

`stackra create` asks where staging and production run (STA-2896). `--region` (or the question) takes an AWS or Google
Cloud region id such as `us-east-1` or `europe-west1`, or a preset (`me`, `eu`, `ksa`), and writes it into the new
app's root runway: each environment's `region` and `regions`, the root `regions` entry, `targets.encore-cloud.cloud`
and the deprecated `providers.aws.region`, keeping every comment. `--yes` keeps the starter's own region and, like the
question's default, still writes it on staging and production, so the new app passes `runway validate`; a name that
is no region is refused before any file is written.

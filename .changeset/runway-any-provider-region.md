---
"@stackra/runway": minor
---

An environment's `region` now takes any provider region (STA-2896). `environments.<env>.region` names an AWS region id
(`us-east-1`, `ap-south-1`), a Google Cloud one (`europe-west1`), or a key of the root `regions`; `me`, `eu` and `ksa`
stay as named presets. The new `resolveRegion(root, name)` answers the cloud and location a name stands for, and
`REGION_PRESETS` holds the three presets. `checkEnvironmentRegion` no longer says figentra/infra places the environment:
it names the three forms, refuses a region that resolves to nothing, asks any Google Cloud environment for a project
(`providers.gcp.projects`, or `providers.gcp.project: true`), and applies the t4g and m6g cache refusal to
me-central-1 by location. `unusedCloudOptIns` counts every AWS environment. The JSON schema's `region` is a lower-case
string instead of an enum. See the ADR 0524 amendment of 2026-11-27.

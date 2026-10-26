---
"@stackra/infra-tools": minor
---

Add `@stackra/infra-tools`: the per-region self-hosted tools stack (Documenso, OCR, Nominatim and Photon on a regional
OpenStreetMap extract, LibreTranslate, Chatwoot) planned from the root runway's `providers.tools` block
(`toolsStackPlan`, `readToolsStackPlan`), the AWS Pulumi program `awsToolsStack` (ECS Fargate, private DNS, EFS), and
the `ToolEndpoint` records OS integrations turns into managed Connections.

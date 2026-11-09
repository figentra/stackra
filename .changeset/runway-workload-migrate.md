---
"@stackra/runway": minor
"@stackra/infra-aws-runtime": minor
---

A workload can name `migrate: { command, timeoutMinutes? }`: a one-off task with the workload's image, env, secrets
and resources that runs once per new revision before the service rolls, and stops the apply when it fails or times
out (15 minutes by default). On AWS it is a second Fargate task definition run by a Pulumi dynamic resource through
`@aws-sdk/client-ecs`, which the stacks repository must list beside `@pulumi/aws`.

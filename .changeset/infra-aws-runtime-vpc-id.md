---
"@stackra/infra-aws-runtime": patch
---

The runtime stack reads the VPC from the root runway's `environments.<env>.shared.network.vpcId` (an id or a
`ref:<path>`, resolved from the stack config) and passes it to `awsRuntime`. Before, `awsRuntimeStack` passed no VPC,
so every plan with a workload or a database failed with "Name the VPC (network.vpcId)". `runtimeNetwork` reports a
`vpcId` that is not one id or `ref:`.

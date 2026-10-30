---
"@stackra/infra-aws-runtime": minor
---

Declare the runway's container workloads (STA-1646, ADR 0493). `awsRuntime` now calls `awsWorkloads`: one ECS
cluster, private DNS namespace and log group per environment, a task execution role reading only the environment's SSM
parameters, and per workload a Fargate task definition (its own secrets and the variables of the resources it uses as
SSM references, never values), a service registered in the namespace, and CPU autoscaling between its bounds. A public
workload gets an ALB in the public subnets admitting HTTPS from Cloudflare's ranges only, a TLS 1.3 listener on the given
certificate and a target group checking its health path. One shared workload security group is created first, and the
databases admit it. New options `workloads.publicSubnetIds`, `workloads.certificateArn` and `workloads.logRetentionDays`;
`AwsRuntime.workloads` returns each service, internal host and public host.

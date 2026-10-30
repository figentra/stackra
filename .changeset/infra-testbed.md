---
"@stackra/infra-testbed": minor
---

Add `@stackra/infra-testbed` (STA-1626, ADR 0484): the testbed, the disposable image-built EC2 test boxes. `testbedPlan`
returns the zod-validated plan (eu-west-1, `heavy` on-demand c7i.2xlarge 2 to 6, `light` spot 1 to 4, a 40 GB root and a
200 GB XFS `/data`, the 70/85 disk guard, the 60 minute idle stop, the weekly image schedule, the toolchain pins and the
Infisical secret grants); `awsTestbed` declares the security group, instance role, launch template, the two Auto Scaling
groups and the EC2 Image Builder pipeline. The package carries the job image Dockerfile, the host image components and
`testbed-agent`, the POSIX box agent (slots, health, job run with a container per job, guard, idle), with its tests.

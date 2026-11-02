# @stackra/infra-testbed

## 0.5.0

### Patch Changes

- @stackra/contracts@0.5.0

## 0.4.0

### Patch Changes

- 0c16187: Fix the testbed's first apply. The launch template is now declared only with the groups, because EC2 refuses a template whose AMI parameter does not exist yet. The AMI parameter moves to `/imagebuilder/stackra-testbed/ami`, the only prefix Image Builder's service-linked role may write. Boxes get the `academorix-ci` key pair that `stackra testbed` connects with. The image steps and the box agent now find the host's mise tools in `/opt/mise`. `stackra testbed` now swaps its SSH allowlist entry with `aws ec2 …-security-group-ingress` (the `ec2` was missing, so a changed IP was never allowed).
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
  - @stackra/contracts@0.4.0

## 0.3.0

### Minor Changes

- 47a1f56: Add `@stackra/infra-testbed` (STA-1626, ADR 0484): the testbed, the disposable image-built EC2 test boxes. `testbedPlan`
  returns the zod-validated plan (eu-west-1, `heavy` on-demand c7i.2xlarge 2 to 6, `light` spot 1 to 4, a 40 GB root and a
  200 GB XFS `/data`, the 70/85 disk guard, the 60 minute idle stop, the weekly image schedule, the toolchain pins and the
  Infisical secret grants); `awsTestbed` declares the security group, instance role, launch template, the two Auto Scaling
  groups and the EC2 Image Builder pipeline. The package carries the job image Dockerfile, the host image components and
  `testbed-agent`, the POSIX box agent (slots, health, job run with a container per job, guard, idle), with its tests.

### Patch Changes

- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/contracts@0.3.0

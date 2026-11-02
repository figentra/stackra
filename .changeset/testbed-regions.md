---
"@stackra/infra-testbed": minor
---

The testbed runs a pool in each of four regions, one stack per region (STA-2042). `testbedPlan` takes a `region`
(eu-west-1, eu-west-2, eu-central-1 or us-east-1) and derives `home`. Only the home stack (eu-west-1) declares the
global instance and image-builder roles, the build bucket and the image pipeline. Its distribution copies each AMI to
all four regions and writes each region's AMI parameter. Every stack declares its region's security group, launch
template and groups. The instance role may act on the testbed groups of all four regions. `AwsTestbed` gains `home`,
and its home-only outputs become optional.

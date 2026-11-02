---
"@stackra/infra-testbed": minor
---

The testbed fits the region's EC2 vCPU quotas (ADR 0516): `heavy` and `light` are each 0 to 1 box by default, the plan
carries `quota` (input, default 8 on-demand and 8 spot vCPUs), and `TESTBED_PLAN_SCHEMA` refuses a plan whose group
maximum exceeds its purchase option's quota, an instance type with no known vCPU count (`INSTANCE_VCPUS`), or a heavy
minimum that leaves no room for the image build. The Image Builder pipeline has no schedule: the owner builds by hand
while `heavy` is at 0. `TESTBED_DEFAULTS.imageSchedule` is gone and `TESTBED_DEFAULTS.quota` is new.

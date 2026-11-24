---
"@stackra/infra-testbed": patch
---

`awsTestbed` takes the image components' versions from the plan's toolchain pins and refuses a plan that lacks one (or
holds it empty) with an error naming the pin, before it declares any resource. It used to fill a missing pin with an
empty string, which `fillComponent`'s "no component ships unfilled" check accepts, so the mistake surfaced only as a
broken image build. A plan from `testbedPlan` always carries every pin, so it is unaffected.

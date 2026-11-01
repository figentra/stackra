# Implementation Plan: two surfaces never share one host

**Spec**: `spec.md` · **Linear**: STA-1796 · **Branch**: `figentra/sta-1796-runway-host-collision`

This Mac runs only oxfmt and oxlint; runway tests run on a box through stackra-8a.

| Step | What                                                                       | Gate         |
| ---- | -------------------------------------------------------------------------- | ------------ |
| 1    | `resolveHost` moves to core; `HostIssue`; `checkHosts(root)` with its test | runway tests |
| 2    | `parseRunway("root")` and `platformRows` refuse a collision, with tests    | runway tests |
| 3    | `stackra validate` and `runway plan` fail on a shared host                 | stackra-8a   |

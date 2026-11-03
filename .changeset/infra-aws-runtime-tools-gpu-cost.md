---
"@stackra/infra-aws-runtime": minor
---

`runtimePlan` counts the tools stack's GPU tools in the monthly cost estimate: one `tools.<tool>` item each (hourly
price x 730 hours x max replicas), so a dev plan with a GPU tool enabled is checked against its $150 cap.

---
"@stackra/infra-tools": minor
---

Add the ML workers of ADR 0492 decision 8 (STA-1637). Catalogue entries `retrieval-embed` and `retrieval-rerank` (the
unmodified Hugging Face text-embeddings-inference image `89-1.9.4`, `BAAI/bge-m3` and `BAAI/bge-reranker-v2-m3` pinned by
revision, GPU), `forecast` (`images/forecast`, StatsForecast), `recommend` (`images/recommend`, `implicit` ALS, off by
default) and `speech` (`images/speech`, faster-whisper `large-v3`, GPU, off by default). `ToolDefinition` gains `gpu` and
`enabled`, `ToolPlan` gains `gpu`, and a catalogue `enabled: false` holds until the runway enables the tool. `awsToolsStack`
declares a GPU capacity provider per GPU instance type (launch template on the ECS GPU-optimised AMI, an Auto Scaling
group from zero, managed scaling) and places `gpu` tools on it, one GPU per task; the others stay on Fargate. A GPU tool starts asleep (`desiredCount` 0) in every environment and
scales itself back to zero after 30 idle minutes (CPUUtilization under 5%); waking is a manual
`aws ecs update-service --desired-count 1` (wake-on-request is STA-1661). Only a runway `replicas` above 0 keeps one up.
`ToolPlan.gpu` gains `hourlyUsd` and `maxReplicas` and each region plan returns `gpuHourlyUsdAtMax` (estimates, for the
cost cap STA-1640). Owner cost: zero by default, about $0.98 an hour per awake `g6.xlarge` (estimate).

---
"@stackra/infra-tools": minor
---

Add the ML workers of ADR 0492 decision 8 (STA-1637). Catalogue entries `retrieval-embed` and `retrieval-rerank` (the
unmodified Hugging Face text-embeddings-inference image `89-1.9.4`, `BAAI/bge-m3` and `BAAI/bge-reranker-v2-m3` pinned by
revision, GPU), `forecast` (`images/forecast`, StatsForecast), `recommend` (`images/recommend`, `implicit` ALS, off by
default) and `speech` (`images/speech`, faster-whisper `large-v3`, GPU, off by default). `ToolDefinition` gains `gpu` and
`enabled`, `ToolPlan` gains `gpu`, and a catalogue `enabled: false` holds until the runway enables the tool. `awsToolsStack`
declares a GPU capacity provider per GPU instance type (launch template on the ECS GPU-optimised AMI, an Auto Scaling
group from zero, managed scaling) and places `gpu` tools on it, one GPU per task; the others stay on Fargate. Owner cost: one
`g6.xlarge` per GPU replica, so two per region by default and three with `speech`.

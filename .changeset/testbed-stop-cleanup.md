---
"@stackra/infra-testbed": patch
---

testbed-agent: a job stopped while it cleans up (Ctrl-C, SIGTERM, `job stop`) still removes its workspace and drops
the box's scale-in protection, byte for byte as figentra/testbed#13. Seen live on 2026-11-05: a cancelled job left
both. A hashed image input: boxes get it with the next image build.

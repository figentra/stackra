---
"@stackra/workflow": patch
---

`NativeWorkflowRunnerDriver#view` now awaits a workflow's async `output()`. Before this, `workflow.run.get@1` showed `{}` for a workflow whose output is computed asynchronously. An async output that rejects falls back to `null`, as a synchronous throw already did.

---
"@stackra/runway": minor
---

**Breaking: a Worker deploy now proves which version answered its smoke.** `@stackra/runway` is still 0.x (and every `@stackra/*` package shares one fixed version), so this ships as a minor bump, but it **breaks a Worker deploy that has not adopted it**. Do both steps below before upgrading, or every Worker deploy fails:

1. **Give every Worker member at least one smoke check** (`targets.cloudflare-workers.members.<key>.smoke`). A member with none is now refused before anything ships.
2. **Make every Worker name its version.** Give it a `version_metadata` binding (`CF_VERSION_METADATA`) and send its id in `x-stackra-version` on every answer. For an assets-only Worker, add a script that answers only `GET /-/version` with `{ "version": "<id>" }` and the same header (`run_worker_first: ["/-/version"]`), and set `versionProof: route` on the member. A Worker whose answers name no version fails every deploy step.

**What changed.** The `cloudflare-workers` provider's smoke now proves which Worker version answered, so a deploy can no longer pass its smoke on the old version. Before, it smoked a new version through `Cloudflare-Workers-Version-Overrides` while that version was in no deployment. Cloudflare honours an override only for a version in the current deployment and routes any other request as usual, so the "0% smoke" checked the version already serving and passed even when the new one was broken.

- **0% stage first.** The provider adds the new version to the deployment at 0% (`wrangler versions deploy <serving>@100 <new>@0`), smokes it there by override, and only then moves traffic in the member's `rollout` steps (10/50/100 for an `api` member in production), smoking after every step, the 100% one included. A failed 0% smoke takes the version out again and moves no traffic; a failed later step puts the previous version back.
- **Every answer names the version.** Each smoke answer must name the version under test, in its `x-stackra-version` header or, with `versionProof: route`, in the `/-/version` route read before and after the checks. Another version answering fails the step. A route member's `/-/version` answering 404 counts as another version.
- **`current` names the commit that serves.** A partial step deploys with the message `<sha> (<percent>%)` and the rollback after a failed step with `<sha> (rolled back to <version>)`. Only the 100% step carries the bare SHA, and `current` skips a failed attempt's deployments.
- **Promotion inside the job.** After the 0% smoke, each step's smoke has `stepSmokeAttempts` (6) attempts per check. With `RUNWAY_DEPLOY_DEADLINE` set (epoch seconds; the reusable Workers workflow sets it 3 minutes inside its 30-minute timeout), no traffic moves unless the holds fit, and a step's smoke stops before the deadline, so the previous version goes back rather than the job being killed mid-split. A failed rollback is reported together with the smoke failure that caused it, saying the traffic may still be split.
- **Rolling back to an older version.** `verify` proves the version its record names. A version uploaded before this change names none: its answers must still be 2xx, and Cloudflare's own deployment must show it at 100%. Core `rollback()` now rolls back every target before it throws, then names each target that is down in one `RunwayDeployFailedError`.
- **A never-deployed Worker** is recognised only by Cloudflare's code 10007; any other `wrangler deployments status` failure (a wrong account, a renamed Worker) stops the deploy.

`WORKER_VERSION`, `WorkerVersionProof` and `servedVersionProblem` are exported, so another smoke (the box deploy's) can apply the same proof.

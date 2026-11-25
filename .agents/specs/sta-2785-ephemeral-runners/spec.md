# Feature Specification: CI on our own machines through single-use, per-job runners

**Feature Branch**: `figentra/sta-2785-ephemeral-runners`

**Created**: 2026-11-25

**Status**: Draft (design for the CTO's read; plan.md and tasks.md follow his read)

**Tier**: big (it amends [ADR 0166](../../../apps/docs/src/docs/adr/0166-ci-policy-runners-budgets-concurrency-and-check-matrix.mdx) CI1, where required checks run)

**Approver**: the CTO (Idris)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2785

**Clarifications status**: open (see Open questions)

**Input**: figentra's GitHub-hosted jobs do not start while the account is locked for billing. This was checked on 2026-11-25 on this public repository: a `pull_request` run and a `workflow_dispatch` run of ci.yml on `ubuntu-latest` both failed every job with zero steps, annotated "The job was not started because your account is locked due to a billing issue". So the free public-repository minutes are blocked too. The first version of STA-2785 moved the gate to a persistent self-hosted runner. The CTO rejected that on 2026-11-25 because this repository is public: a fork's pull request runs the fork's own workflow file and can target any runner label, so one approved run would execute outside code on a long-lived shared machine. His decision: no persistent self-hosted runner on a public repository; CI on our machines only through single-use, per-job runners on a host that serves nothing else; fork pull requests stay on GitHub-hosted runners or require approval.

### Sources

- The billing test, 2026-11-25: figentra/stackra runs 45539790031 (`pull_request`) and 45548828087 (`workflow_dispatch`); every hosted job failed with zero steps and the billing-lock annotation.
- `.github/workflows/ci.yml`, `regen.yml`, `release.yml`; `.github/workflows/README.md`; the first STA-2785 branch `figentra/sta-2785-ci-self-hosted` (the persistent-runner version, not opened).
- ADR 0166 (CI policy and runners), ADR 0484 (the testbed: image pipeline, agent), ADR 0516 (AWS quotas), ADR 0525 (sops and OIDC secrets), ADR 0453 (release provenance).
- GitHub docs: self-hosted runner security for public repositories; just-in-time runners (`generate-jitconfig`); `workflow_job` webhooks; fork pull request approval.

## Design (two pages, for the CTO's read)

### The threat model

- **Any job is untrusted.** Every job on these runners may run hostile code, whether a member's pull request (a compromised dependency or account) or an approved fork. The design never relies on the workflow file to keep a job away: whoever writes the pull request writes that file.
- **What must not leak or persist:**
  - the host and its other jobs;
  - the cloud account's credentials (instance metadata);
  - the private network (tailnet, the boxes, the testbed);
  - shared caches a later trusted job reads (cache poisoning);
  - the controller's GitHub credential.
- **Out of scope:** secrets the workflow is designed to give a job (the OIDC-decrypted `ci/build` scopes). They behave as they do on GitHub-hosted runners, and those rules are unchanged.

### The shape

1. **One fresh VM per job, destroyed after it.** The controller starts one EC2 instance for each queued job that asks for the label `stackra-ephemeral`.
   - The VM boots from the testbed's image (ADR 0484 decision 2, the job toolchain built from `mise.toml` weekly and on change).
   - It runs exactly one job and terminates itself when the job ends, or at the job's timeout plus a margin, whichever comes first.
   - There's no container-per-job on a shared host here: the testbed's model trusts its jobs, and these jobs aren't trusted. A VM boundary is the isolation GitHub-hosted runners give.
2. **Just-in-time runner registration.** For each job the controller asks GitHub for a JIT runner configuration (`POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig`, labels `self-hosted` and `stackra-ephemeral`).
   - It passes the configuration to the VM in its user data, read once and erased.
   - A JIT runner takes one job and deregisters itself. Nothing persistent registers with the repository, so there is no long-lived runner for a fork to target.
3. **The controller runs on its own host.**
   - It is a small service that receives GitHub's `workflow_job` webhooks (signed, verified with the webhook secret) and starts or reaps VMs.
   - It holds the only GitHub credential: an App installation token with the repository permission JIT registration needs (Administration: write, this repository only). The token is short-lived; the App key is a secret set by a person.
   - Job VMs can't reach the controller.
4. **Fork pull requests get no VM.** The controller reads the job's run and refuses one whose head repository is a fork.
   - Such a job waits and times out, so a fork's pull request is checked by GitHub-hosted runners (once billing allows) or by a maintainer running it on a branch.
   - The repository's fork-approval setting stays at "all external contributors" as a second lock.
5. **Network.** A job VM sits in its own subnet with egress to the internet only.
   - It is denied the instance metadata endpoint (IMDS off, no instance role), the tailnet, the testbed, the boxes, the controller and the account's VPC endpoints.
   - It gets credentials the same way a hosted runner does: the job's GitHub OIDC token and the sops scopes `estate/secret-callers.mjs` grants (ADR 0525).
6. **No shared writable state.**
   - No cache is shared between jobs on our side. The turbo remote cache keeps today's rule: a job writes it only with the decrypted `ci/build/turbo` scope, and forks get none.
   - The VM's disks are deleted with the instance.
   - A warm pnpm store is baked into the image from main, read-only.
7. **Which jobs move.** ci.yml's dependency-scan, gate and dependency-review, plus regen, take `runs-on: [self-hosted, stackra-ephemeral]`. They return to `ubuntu-latest` with a one-line change when billing allows. release.yml, deploys and anything triggered by `pull_request_target` never move: npm provenance needs GitHub-hosted runners (ADR 0453).

### Failure and cost

- **Faults fail closed:**
  - if the controller is down, a job just waits;
  - a VM that misses its deadline is terminated by the controller's reaper, with an instance tag as the backstop;
  - an orphaned JIT runner deregisters when its VM dies.
- **Quotas:** AWS quotas are fixed inputs (ADR 0516), so one region's spot pool runs at most two VMs at once (8 vCPU), with on-demand as a fallback. A queue beyond that waits; it is never a quota request.
- **Cost:** a gate run on a `c7i.2xlarge` spot instance costs cents. The ceiling is set in the plan and alarmed.

## Acceptance criteria

The plan turns each into a test.

- **AC-001**: WHEN a job asks for `stackra-ephemeral` from a branch of this repository, THE controller SHALL start one VM with a JIT runner for that job only, and the VM SHALL terminate when the job ends.
- **AC-002**: WHEN the job comes from a fork's pull request, THE controller SHALL start no VM.
- **AC-003**: WHILE a job runs, THE job VM SHALL be unable to reach the instance metadata endpoint, the tailnet, the controller or any other VM.
- **AC-004**: WHEN a job ends or its VM dies, THE controller SHALL leave no runner registered for that job.
- **AC-005**: WHEN a job starts, THE system SHALL give it a VM in which no file, process or cache entry of an earlier job exists.
- **SC-001:** a red-team job tries metadata, tailnet, persistence and cross-job reads, and every attempt fails.
- **SC-002:** the gate's runtime on a VM is within 1.5× of its last GitHub-hosted runtime.

### Repository rule (added with this change)

`.github/workflows/README.md` gains the rule: no persistent self-hosted runner serves a public repository. Our machines serve its CI only through single-use, per-job runners on hosts that serve nothing else.

### Open questions for the CTO

1. **The host for the controller and the VMs:** the testbed's AWS account and region, or a separate account. I'd use a separate account, so a job VM can never share an account boundary with the testbed.
2. **Webhooks or polling:** webhooks need a public endpoint (a small Worker forwarding to the controller); polling the queued jobs every 15 s needs none. I'd poll first.
3. **The App:** whether a new GitHub App with Administration: write on this repository is acceptable, or whether it should use stackra-bot's App with that permission added.
4. **Billing:** whether this should be built at all if the owner unlocks billing soon. GitHub-hosted runners then cover every job for free, since the repository is public, and this design becomes a fallback.

## Impact

- **Apps touched**: apps/docs (the runbook and an ADR amending 0166 CI1, at plan time)
- **Services touched**: none
- **Packages touched**: a new controller (its home is decided in the plan: next to `@stackra/infra-testbed`, or its own package); `.github/workflows/ci.yml` and `regen.yml` (`runs-on` only)
- **Public contract change**: no (required check names are unchanged)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: high. It decides where untrusted code runs and holds a credential that registers runners. It needs a strict read and a red-team test before any required check depends on it
- **Secrets**: the controller's GitHub App key, set by a person; job VMs get only the OIDC-granted `ci/build` scopes, as hosted runners do
- **ADR needed**: yes, an amendment of ADR 0166 CI1 (where required checks run), numbered at plan time
- **New dependencies**: none decided yet
- **Deploy modes**: the controller runs on its own host; job VMs on demand
- **Licence tier**: free (MIT, this repo)
- **Docs to update**: `.github/workflows/README.md` (the rule, in this change), the CI runbook
- **Lane**: full
- **Change risk**: high
- **Money**: spot instances under an alarmed ceiling

# Implementation Plan: merge stewards, bot approval and auto-merge without `--admin`

**Spec**: `spec.md` · **Linear**: STA-1856 · **Branch**: `figentra/sta-1856-merge-stewards`

On this Mac we run only oxfmt and oxlint. `pnpm agents:check` and the workflow's self-check run in CI.

| Step | What                                                                                                     | Covers         | Gate                                 |
| ---- | -------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------ |
| 1    | `.agents/agents/git-steward.md`, `ci-steward.md`, `linear-steward.md`; README roster; `pnpm agents:sync` | FR-001 to 003  | `agents sync --lint`, `agents:check` |
| 2    | `.github/workflows/pr-approve.yml` (dispatch and call), with the owner-only list and its self-check      | FR-004, FR-005 | the self-check step; zizmor in CI    |
| 3    | Workflows README row; ADR 0119 amendment                                                                 | docs           | format                               |
| 4    | The `merge-queue` replacement, below (proposal only)                                                     | FR-006         | none                                 |

## Design

**Who does what.** `git-steward` decides. `pr-approve.yml` re-checks the rules a PR author could get around: changed
paths, required checks, the author, the head SHA and the owner labels. Only then does it approve. `pnpm pr:merge`
(`@figentra/cli`) still does the merge. It never uses `--admin`, and it already checks the Quality Gate, the
`stackra-reviewer` verdict and the owner labels. In core it adds the PR to the merge queue; in a repo with no queue
it squash-merges at the checked head. The approval and the merge are separate steps, so neither one alone can merge
a PR that the other would refuse.

**Why the key lives in an environment.** A repository or org secret can be read by a workflow run on any branch, and
agents push branches. A branch could edit the workflow and approve itself. Keeping the App key in the `pr-approval`
environment, which allows `main` only, means only the reviewed workflow on `main` can mint the token. A
`workflow_call` job resolves `environment:` in the calling repo, so every repo that adopts the workflow creates the
same environment.

**Why every workflow file is owner-only.** Any workflow can read the repo's secrets. `ci.yml` also defines the
required check, so changing it changes what "green" means. The owner listed deploy, promote and release workflows;
under this rule the rest of `.github/workflows` waits for the owner as well. To narrow the list later, edit the one
`OWNER_ONLY` pattern.

**The approving identity.** GitHub does not let an identity approve its own PR. The workflow therefore refuses a PR
whose author is the App that minted the token, and it reads that App's login from the token step. Today agents open
PRs as `stackra-bot`. If the `pr-approval` secrets hold `stackra-bot`'s key, every agent PR is refused. The owner
decides which App those secrets name (see the owner list in the PR).

**The dispatch input is `head`, not `sha`.** The bash guard treats a `sha` field on `workflow run` as a production
deploy. `head` also says what the field is for: the SHA the caller checked.

## The `merge-queue` replacement (proposal, FR-006)

`~/.local/bin/merge-queue` merges `ready-to-merge` PRs in `figentra/academorix` with `--admin --merge` every five
minutes. The proposed replacement:

1. Once `figentra/academorix` has the caller workflow below and its own `pr-approval` environment, stop running the
   loop. `git-steward` handles each PR when its reviews come in.
2. Until then, the owner keeps the loop but swaps its merge line for an approval request plus GitHub auto-merge.
   `--auto` waits for the required checks and the approval, and it bypasses nothing:

   ```sh
   head=$(gh pr view "$p" --repo figentra/academorix --json headRefOid --jq .headRefOid)
   gh workflow run pr-approve.yml --repo figentra/academorix -f pr="$p" -f head="$head" &&
     gh pr merge "$p" --repo figentra/academorix --auto --squash >/dev/null 2>&1 && echo "$(date -u +%H:%M) queued #$p"
   ```

   Use `--merge` instead of `--squash` if academorix allows only merge commits. The `bad` failing-checks pre-check
   can go, because `--auto` waits for the checks itself.

The caller workflow for another figentra repo (`.github/workflows/pr-approve.yml` there):

```yaml
name: PR approval
on:
  workflow_dispatch:
    inputs:
      pr: { description: Pull request number, required: true, type: number }
      head: { description: The head SHA the caller checked, required: true, type: string }
permissions: {}
jobs:
  approve:
    permissions: { contents: read, pull-requests: read, checks: read, statuses: read }
    uses: figentra/stackra/.github/workflows/pr-approve.yml@<main sha> # main
    with: { pr: "${{ inputs.pr }}", head: "${{ inputs.head }}" }
```

## Follow-ups (not in this change)

- `figentra pr merge --auto` in `@figentra/cli`: in a repo with no merge queue, turn on GitHub auto-merge instead
  of refusing while checks are still pending.
- Move the App key from environment secrets to Infisical `/ci` over OIDC, with the identity bound to `main` (STA-1827
  does this for `release.yml`).

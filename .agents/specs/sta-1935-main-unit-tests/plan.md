# Implementation Plan: main's unit tests pass again

**Linear**: STA-1935 · **Spec**: `spec.md`

## Steps

1. devtools-kit: the bus-occurrence context expects `audit: expect.any(Function)`.
2. repo-checks and cli: category count 14; drop `.specify/integration.json` and `.specify/a.yml` from the exemption
   lists.
3. search: migrations 0001 and 0002 expect no `drop extension` in the down.
4. panel: the `TextAreaField` mock wraps `errorMessage` in a `span`.
5. iam: the declaration-emit fixture sets `types: []`.
6. tenancy: commit gen's `entities.gen.ts` and manifest; the `node` barrel exports `TENANCY_ENTITIES`; the barrel
   test lists it; a patch changeset.
7. docs: regenerate `standards/structure.mdx` with `stackra structure --write-docs`.

## Verification

On the testbed: `turbo run test --continue` over cli, devtools-kit, iam, panel, repo-checks, search and tenancy; the
only failure left is `skill-licences` on the testbed's missing `.agents/skills/.licences.yaml`. CI confirms.

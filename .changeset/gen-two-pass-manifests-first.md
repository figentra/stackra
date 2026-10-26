---
"@stackra/gen": minor
"@stackra/cli": minor
---

Gen runs in two passes so services that consume each other's clients in a cycle can bootstrap (STA-1232). Pass 1
writes every member's `stackra.manifest.json` without its clients (a consumed service in the same workspace is no
longer a refusal there); pass 2 writes the clients and the rest against those manifests, in rounds until one writes
nothing. A refused run still writes its clients and, when only workspace services stand in the way, its manifest.
New: `stackra gen --manifests` (pass 1 alone), `generate(root, { pass: "manifests" })`, `generateMember(..., { pass })`,
`emitClients(ir, { pending })` and `MemberIR.workspaceServices`.

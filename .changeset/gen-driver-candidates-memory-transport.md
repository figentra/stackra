---
"@stackra/gen": minor
"@stackra/clients": minor
---

Gen writes the driver candidates of every declared package into the member wiring (memory, postgres and valkey alike),
from the `classes` and `config` that package manifests now record, keeps an authored root `vitest.config.ts` that
imports `./.stackra/vitest.config`, and the generated test setup loads `@stackra/clients/testing`. `@stackra/clients`
adds a ClientFake-based memory `ClientTransport` (`CLIENTS_TESTING_PLUGIN`) and the `memoryTransport(app)` helper.

---
"@stackra/cli": minor
"@stackra/runway": minor
---

`stackra dev` at the root of a product with service members runs the whole product (STA-2840). It runs gen on every
service, builds one Encore app of them all under `.stackra/dev/encore` (`syncDevEncoreApp`, kept in step on edit) and
starts ONE `encore run` on the gateway port, instead of one per service. Each service's dev port is forwarded to that
gateway, so a relay inbox or client URL naming a member's port still answers. Once the gateway answers, every service
database is migrated (`stackra db migrate`) and seeded (`stackra db seed`, `--seed minimal|demo|test|none`, `demo` by
default). Apps, packages, the docs site and the Workers start beside it through turbo, each Worker on its lane's runway
dev port. The lane comes from `STACKRA_LANE`, else from the product's row of `environments.dev.lanes.repos`
(`devLane`), and the quick doctor checks that lane's ports, not the dashboard one Encore daemon shares. The dev facts
file carries the dev infra ports (the gateway). `stackra db seed` in a service builds the seed entry alone, since a
service has no tsdown config. The run ends together: encore exiting, the fan-out failing or Ctrl-C stops the rest.

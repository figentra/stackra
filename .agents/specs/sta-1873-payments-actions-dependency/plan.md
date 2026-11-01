# Plan: payments declares @stackra/actions (STA-1873)

1. `packages/commerce/payments/package.json`: add `"@stackra/actions": "workspace:*"`.
2. `pnpm-lock.yaml`: add the `link:../../application/actions` entry under `packages/commerce/payments`.
3. A patch changeset for `@stackra/payments`; CI's frozen install and gen confirm both.

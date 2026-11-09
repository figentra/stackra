# @stackra/panel

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [54db249]
  - @stackra/config@0.32.0
  - @stackra/ui@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/clients@0.32.0
  - @stackra/database@0.32.0
  - @stackra/documents@0.32.0
  - @stackra/filesystem@0.32.0
  - @stackra/icons@0.32.0
  - @stackra/navigation@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/access-log@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/query@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/pricing@0.32.0
  - @stackra/experience@0.32.0
  - @stackra/data-transfer@0.32.0
  - @stackra/entitlements@0.32.0
  - @stackra/money@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/support@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 7179d1a: `ChatFormPart` (`@stackra/panel/react`) draws an action's form in a chat turn from its JSON Schema input: one field per key, drawn as a screen draws it, prefilled by the assistant, with uploads through the host's `upload`, and sent as the person's answer. `useZodFormHandle` (`@stackra/ui/form`) runs a form over a zod schema with no class, and `useSchemaFormHandle` now builds on it. `TamoFormPart` gains `id`, which the host answers with the sent values, as a question's.
- 29af13d: `PercentMetric` (with `PercentMetric$`) holds a rate as a ratio, and a KPI bound to it shows a percent in the reader's
  locale with its trend in percentage points. A KPI takes `.note(path)`, a muted line under the value worded by the
  derived key `<module>::widgets.<widget>.<path>` with `{count}`, so a main-currency tile can say "+2 other currencies".

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [0f05f60]
- Updated dependencies [7179d1a]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/i18n@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/clients@0.31.0
  - @stackra/data-transfer@0.31.0
  - @stackra/documents@0.31.0
  - @stackra/access-log@0.31.0
  - @stackra/entitlements@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/query@0.31.0
  - @stackra/experience@0.31.0
  - @stackra/navigation@0.31.0
  - @stackra/pricing@0.31.0
  - @stackra/money@0.31.0
  - @stackra/filesystem@0.31.0
  - @stackra/model@0.31.0
  - @stackra/icons@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/support@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 7fad9a3: `fieldKindOf(jsonSchema, path)` draws a form field from an input's JSON Schema with the same kinds `inputKind` gives from zod, plus long text, several choices, money, record references and uploads, so the chat's forms match the console's.

### Patch Changes

- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [85cd1b5]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [88fb0eb]
- Updated dependencies [0394e56]
- Updated dependencies [2307506]
- Updated dependencies [d3c8b27]
- Updated dependencies [8084b3a]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a03990d]
- Updated dependencies [a3a3190]
- Updated dependencies [d3c8b27]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/actions@0.30.0
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/documents@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/experience@0.30.0
  - @stackra/filesystem@0.30.0
  - @stackra/data-transfer@0.30.0
  - @stackra/container@0.30.0
  - @stackra/clients@0.30.0
  - @stackra/access-log@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/entitlements@0.30.0
  - @stackra/query@0.30.0
  - @stackra/pricing@0.30.0
  - @stackra/navigation@0.30.0
  - @stackra/money@0.30.0
  - @stackra/model@0.30.0
  - @stackra/config@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/icons@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [0e8f570]
- Updated dependencies [45afd22]
- Updated dependencies [25b99da]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/entitlements@0.29.0
  - @stackra/clients@0.29.0
  - @stackra/access-log@0.29.0
  - @stackra/documents@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/query@0.29.0
  - @stackra/money@0.29.0
  - @stackra/pricing@0.29.0
  - @stackra/data-transfer@0.29.0
  - @stackra/filesystem@0.29.0
  - @stackra/model@0.29.0
  - @stackra/icons@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/experience@0.29.0
  - @stackra/navigation@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/access-log@0.28.0
  - @stackra/clients@0.28.0
  - @stackra/database@0.28.0
  - @stackra/documents@0.28.0
  - @stackra/entitlements@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/query@0.28.0
  - @stackra/experience@0.28.0
  - @stackra/navigation@0.28.0
  - @stackra/pricing@0.28.0
  - @stackra/data-transfer@0.28.0
  - @stackra/money@0.28.0
  - @stackra/filesystem@0.28.0
  - @stackra/model@0.28.0
  - @stackra/icons@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/support@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
  - @stackra/database@0.27.0
  - @stackra/data-transfer@0.27.0
  - @stackra/access-log@0.27.0
  - @stackra/entitlements@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/pricing@0.27.0
  - @stackra/documents@0.27.0
  - @stackra/clients@0.27.0
  - @stackra/navigation@0.27.0
  - @stackra/query@0.27.0
  - @stackra/experience@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/money@0.27.0
  - @stackra/filesystem@0.27.0
  - @stackra/model@0.27.0
  - @stackra/icons@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/support@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
  - @stackra/database@0.26.0
  - @stackra/access-log@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/entitlements@0.26.0
  - @stackra/query@0.26.0
  - @stackra/pricing@0.26.0
  - @stackra/documents@0.26.0
  - @stackra/clients@0.26.0
  - @stackra/navigation@0.26.0
  - @stackra/experience@0.26.0
  - @stackra/data-transfer@0.26.0
  - @stackra/money@0.26.0
  - @stackra/filesystem@0.26.0
  - @stackra/model@0.26.0
  - @stackra/icons@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/support@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/tenancy@0.25.0
  - @stackra/access-log@0.25.0
  - @stackra/entitlements@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/data-transfer@0.25.0
  - @stackra/clients@0.25.0
  - @stackra/navigation@0.25.0
  - @stackra/query@0.25.0
  - @stackra/documents@0.25.0
  - @stackra/experience@0.25.0
  - @stackra/pricing@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/money@0.25.0
  - @stackra/filesystem@0.25.0
  - @stackra/model@0.25.0
  - @stackra/icons@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/support@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/clients@0.24.0
  - @stackra/documents@0.24.0
  - @stackra/access-log@0.24.0
  - @stackra/entitlements@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/query@0.24.0
  - @stackra/experience@0.24.0
  - @stackra/navigation@0.24.0
  - @stackra/pricing@0.24.0
  - @stackra/data-transfer@0.24.0
  - @stackra/money@0.24.0
  - @stackra/filesystem@0.24.0
  - @stackra/model@0.24.0
  - @stackra/icons@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/support@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/clients@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/access-log@0.23.0
  - @stackra/entitlements@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/pricing@0.23.0
  - @stackra/documents@0.23.0
  - @stackra/experience@0.23.0
  - @stackra/navigation@0.23.0
  - @stackra/query@0.23.0
  - @stackra/data-transfer@0.23.0
  - @stackra/money@0.23.0
  - @stackra/filesystem@0.23.0
  - @stackra/model@0.23.0
  - @stackra/icons@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/support@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [3a9a6be]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/access-log@0.22.0
  - @stackra/pricing@0.22.0
  - @stackra/documents@0.22.0
  - @stackra/entitlements@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/clients@0.22.0
  - @stackra/query@0.22.0
  - @stackra/experience@0.22.0
  - @stackra/model@0.22.0
  - @stackra/data-transfer@0.22.0
  - @stackra/navigation@0.22.0
  - @stackra/money@0.22.0
  - @stackra/filesystem@0.22.0
  - @stackra/icons@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/support@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/tenancy@0.21.0
  - @stackra/access-log@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/clients@0.21.0
  - @stackra/money@0.21.0
  - @stackra/pricing@0.21.0
  - @stackra/data-transfer@0.21.0
  - @stackra/documents@0.21.0
  - @stackra/filesystem@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/experience@0.21.0
  - @stackra/navigation@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/entitlements@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/query@0.21.0
  - @stackra/icons@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/clients@0.20.0
  - @stackra/documents@0.20.0
  - @stackra/access-log@0.20.0
  - @stackra/entitlements@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/query@0.20.0
  - @stackra/money@0.20.0
  - @stackra/pricing@0.20.0
  - @stackra/data-transfer@0.20.0
  - @stackra/filesystem@0.20.0
  - @stackra/model@0.20.0
  - @stackra/icons@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/experience@0.20.0
  - @stackra/navigation@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

## 0.19.0

### Minor Changes

- 58a8fa5: Every write action's permission is at least L2 (STA-2096, owner decision 2026-11-04). gen refuses an action whose
  permission is L0 or L1 with `action_risk_below_write`. Raised: `collaboration.room.publish`, `media.upload.create`,
  `data_maintenance.synonym.create` and `.update`, `analytics.analytics_batch.ingest`, `consent.consent_snapshot.issue`,
  `identity.passkey.challenge`, `loyalty_kit.loyalty_account.enroll` to L2;
  `segments.segment.recompute` and `privacy.subject.export` to L2 (system); `loyalty_kit.loyalty_account.redeem` and
  `.stamp` to L3 (a points balance); `loyalty_kit.loyalty_account.expire` to L3 (system); `panel.view.share` to L2;
  `identity.passkey.verify` (it mints a session) and `identity.passkey.confirm` (it keeps a new key) to L4;
  `webhooks.webhook_delivery.send` (an external send) and `access_log.access_log_entry.purge` (it deletes for good) to L4
  (system).

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [e5ac3d0]
- Updated dependencies [d2b3d22]
- Updated dependencies [eafb209]
- Updated dependencies [d22e767]
- Updated dependencies [e283a31]
- Updated dependencies [27f2b3f]
- Updated dependencies [15d8a1b]
- Updated dependencies [bc5a0ab]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/access-log@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/filesystem@0.19.0
  - @stackra/clients@0.19.0
  - @stackra/money@0.19.0
  - @stackra/pricing@0.19.0
  - @stackra/data-transfer@0.19.0
  - @stackra/documents@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/experience@0.19.0
  - @stackra/navigation@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/entitlements@0.19.0
  - @stackra/query@0.19.0
  - @stackra/icons@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- @stackra/access-log@0.18.1
  - @stackra/tenancy@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/clients@0.18.1
  - @stackra/navigation@0.18.1
  - @stackra/experience@0.18.1
  - @stackra/query@0.18.1
  - @stackra/pricing@0.18.1
  - @stackra/documents@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/money@0.18.1
  - @stackra/data-transfer@0.18.1
  - @stackra/database@0.18.1
  - @stackra/filesystem@0.18.1
  - @stackra/model@0.18.1
  - @stackra/icons@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/support@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/entitlements@0.18.1

## 0.18.0

### Patch Changes

- @stackra/access-log@0.18.0
  - @stackra/tenancy@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/clients@0.18.0
  - @stackra/navigation@0.18.0
  - @stackra/experience@0.18.0
  - @stackra/query@0.18.0
  - @stackra/pricing@0.18.0
  - @stackra/documents@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/money@0.18.0
  - @stackra/data-transfer@0.18.0
  - @stackra/database@0.18.0
  - @stackra/filesystem@0.18.0
  - @stackra/model@0.18.0
  - @stackra/icons@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/support@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/entitlements@0.18.0

## 0.17.2

### Patch Changes

- @stackra/access-log@0.17.2
  - @stackra/tenancy@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/clients@0.17.2
  - @stackra/navigation@0.17.2
  - @stackra/experience@0.17.2
  - @stackra/query@0.17.2
  - @stackra/pricing@0.17.2
  - @stackra/documents@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/money@0.17.2
  - @stackra/data-transfer@0.17.2
  - @stackra/database@0.17.2
  - @stackra/filesystem@0.17.2
  - @stackra/model@0.17.2
  - @stackra/icons@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/support@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/entitlements@0.17.2

## 0.17.1

### Patch Changes

- @stackra/iam@0.17.1
  - @stackra/pricing@0.17.1
  - @stackra/documents@0.17.1
  - @stackra/navigation@0.17.1
  - @stackra/query@0.17.1
  - @stackra/clients@0.17.1
  - @stackra/access-log@0.17.1
  - @stackra/experience@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/money@0.17.1
  - @stackra/data-transfer@0.17.1
  - @stackra/database@0.17.1
  - @stackra/filesystem@0.17.1
  - @stackra/model@0.17.1
  - @stackra/icons@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/support@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/entitlements@0.17.1
  - @stackra/tenancy@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/clients@0.17.0
  - @stackra/money@0.17.0
  - @stackra/pricing@0.17.0
  - @stackra/data-transfer@0.17.0
  - @stackra/database@0.17.0
  - @stackra/documents@0.17.0
  - @stackra/filesystem@0.17.0
  - @stackra/model@0.17.0
  - @stackra/icons@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/experience@0.17.0
  - @stackra/navigation@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/support@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/access-log@0.17.0
  - @stackra/entitlements@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/tenancy@0.17.0
  - @stackra/query@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/access-log@0.16.0
  - @stackra/navigation@0.16.0
  - @stackra/query@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/clients@0.16.0
  - @stackra/pricing@0.16.0
  - @stackra/database@0.16.0
  - @stackra/documents@0.16.0
  - @stackra/filesystem@0.16.0
  - @stackra/model@0.16.0
  - @stackra/icons@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/experience@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/tenancy@0.16.0
  - @stackra/entitlements@0.16.0
  - @stackra/data-transfer@0.16.0
  - @stackra/money@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [3c99709]
  - @stackra/documents@0.15.0
  - @stackra/experience@0.15.0
  - @stackra/data-transfer@0.15.0
  - @stackra/access-log@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/tenancy@0.15.0
  - @stackra/pricing@0.15.0
  - @stackra/clients@0.15.0
  - @stackra/navigation@0.15.0
  - @stackra/query@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/money@0.15.0
  - @stackra/database@0.15.0
  - @stackra/filesystem@0.15.0
  - @stackra/model@0.15.0
  - @stackra/icons@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/support@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/entitlements@0.15.0

## 0.14.4

### Patch Changes

- 1f55b7a: `EntryFactory.list` and `Display.list` take named option types (`ListEntryOptions`, `ListDisplayOptions`) shared with
  their records, and `WidgetDescriptorOptions` is derived from `WidgetDescriptor`. The shapes are unchanged.
- Updated dependencies [cc150d2]
  - @stackra/navigation@0.14.4
  - @stackra/query@0.14.4
  - @stackra/clients@0.14.4
  - @stackra/experience@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/pricing@0.14.4
  - @stackra/documents@0.14.4
  - @stackra/access-log@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/money@0.14.4
  - @stackra/data-transfer@0.14.4
  - @stackra/database@0.14.4
  - @stackra/filesystem@0.14.4
  - @stackra/model@0.14.4
  - @stackra/icons@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/support@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/entitlements@0.14.4
  - @stackra/tenancy@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/clients@0.14.3
  - @stackra/money@0.14.3
  - @stackra/pricing@0.14.3
  - @stackra/data-transfer@0.14.3
  - @stackra/database@0.14.3
  - @stackra/documents@0.14.3
  - @stackra/filesystem@0.14.3
  - @stackra/model@0.14.3
  - @stackra/icons@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/experience@0.14.3
  - @stackra/navigation@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/support@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/access-log@0.14.3
  - @stackra/entitlements@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/tenancy@0.14.3
  - @stackra/query@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/clients@0.14.2
  - @stackra/money@0.14.2
  - @stackra/pricing@0.14.2
  - @stackra/data-transfer@0.14.2
  - @stackra/database@0.14.2
  - @stackra/documents@0.14.2
  - @stackra/filesystem@0.14.2
  - @stackra/model@0.14.2
  - @stackra/icons@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/experience@0.14.2
  - @stackra/navigation@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/access-log@0.14.2
  - @stackra/entitlements@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/tenancy@0.14.2
  - @stackra/query@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/clients@0.14.1
  - @stackra/money@0.14.1
  - @stackra/pricing@0.14.1
  - @stackra/data-transfer@0.14.1
  - @stackra/database@0.14.1
  - @stackra/documents@0.14.1
  - @stackra/filesystem@0.14.1
  - @stackra/model@0.14.1
  - @stackra/icons@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/experience@0.14.1
  - @stackra/navigation@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/support@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/access-log@0.14.1
  - @stackra/entitlements@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/tenancy@0.14.1
  - @stackra/query@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/clients@0.14.0
  - @stackra/money@0.14.0
  - @stackra/pricing@0.14.0
  - @stackra/data-transfer@0.14.0
  - @stackra/database@0.14.0
  - @stackra/documents@0.14.0
  - @stackra/filesystem@0.14.0
  - @stackra/model@0.14.0
  - @stackra/icons@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/experience@0.14.0
  - @stackra/navigation@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/support@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/access-log@0.14.0
  - @stackra/entitlements@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/tenancy@0.14.0
  - @stackra/query@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/clients@0.13.0
  - @stackra/money@0.13.0
  - @stackra/pricing@0.13.0
  - @stackra/data-transfer@0.13.0
  - @stackra/database@0.13.0
  - @stackra/documents@0.13.0
  - @stackra/filesystem@0.13.0
  - @stackra/model@0.13.0
  - @stackra/icons@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/experience@0.13.0
  - @stackra/navigation@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/support@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/access-log@0.13.0
  - @stackra/entitlements@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/tenancy@0.13.0
  - @stackra/query@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/clients@0.12.0
  - @stackra/money@0.12.0
  - @stackra/pricing@0.12.0
  - @stackra/data-transfer@0.12.0
  - @stackra/database@0.12.0
  - @stackra/documents@0.12.0
  - @stackra/filesystem@0.12.0
  - @stackra/model@0.12.0
  - @stackra/icons@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/experience@0.12.0
  - @stackra/navigation@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/support@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/access-log@0.12.0
  - @stackra/entitlements@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/tenancy@0.12.0
  - @stackra/query@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/clients@0.11.1
  - @stackra/money@0.11.1
  - @stackra/pricing@0.11.1
  - @stackra/data-transfer@0.11.1
  - @stackra/database@0.11.1
  - @stackra/documents@0.11.1
  - @stackra/filesystem@0.11.1
  - @stackra/model@0.11.1
  - @stackra/icons@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/experience@0.11.1
  - @stackra/navigation@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/support@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/access-log@0.11.1
  - @stackra/entitlements@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/tenancy@0.11.1
  - @stackra/query@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/clients@0.11.0
  - @stackra/money@0.11.0
  - @stackra/pricing@0.11.0
  - @stackra/data-transfer@0.11.0
  - @stackra/database@0.11.0
  - @stackra/documents@0.11.0
  - @stackra/filesystem@0.11.0
  - @stackra/model@0.11.0
  - @stackra/icons@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/experience@0.11.0
  - @stackra/navigation@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/support@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/access-log@0.11.0
  - @stackra/entitlements@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/tenancy@0.11.0
  - @stackra/query@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/access-log@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/clients@0.10.0
  - @stackra/documents@0.10.0
  - @stackra/filesystem@0.10.0
  - @stackra/icons@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/navigation@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/tenancy@0.10.0
  - @stackra/query@0.10.0
  - @stackra/money@0.10.0
  - @stackra/pricing@0.10.0
  - @stackra/data-transfer@0.10.0
  - @stackra/model@0.10.0
  - @stackra/experience@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/entitlements@0.10.0
  - @stackra/iam@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Minor Changes

- 681d01a: The panel's generic resource pages on React Native. `@stackra/clients/native` is a new entry with the native data
  hooks: `useQuery`, which refetches a stale answer when the app returns to the foreground, and `useAction`, the same
  action hook as on the web. `@stackra/panel/native` adds `ResourceListPage`, `ResourceViewPage`, `ResourceFormPage` and
  `ActionInputModal` with the web pages' props: the list with search, filters, sort, cursor paging, views, row and bulk
  actions and pull to refresh; the record with its entries and sections; the Create and Edit form drawn from the action's
  input and checked by its schema; and the action form for an input that needs more than the record id. Every run goes
  through a native action runner with the declared confirmation and toasts. Each page takes the resource, and a View or
  Edit page the record id, from the host screen until gen registers resource screens on native. The showcase lists the
  four for native.
- 681d01a: The panel's server-driven UI specs (STA-1981). `@stackra/panel` adds the spec types `ActionButtonSpec`,
  `EmptyStateSpec`, `RowActionsSpec`, `BulkActionsSpec`, `FormFieldSpec`, `FilterSpec` and `TableColumnSpec`, with the
  `FieldControl` and `FilterKind` enums. A placed action, a column, a filter, a form field and the table now record that
  look: `Placement.*`, `Column.*`, `Filter.*` and `FormField.from` take the fields, and each builder gains `with(look)`.
  The generic resource pages draw it: a placement's icon, description, shortcut, tone, disabled reason and link, hidden
  without its permission or while its `visibleWhen` record path is not true, its own confirmation words through the
  action runner's new `confirm` option, and a bulk `runMode` of `once`; a column's header words, alignment, widths, pin,
  wrap, resizing, row header, start hidden (a `hidden` column now stays choosable), inline edit through the update action,
  aggregate and cell kind (badge, status, money, principal, date, link, copy); a filter's words, control, quick filter
  settings and choices (an enum's codes by their labels); the table's sticky header, column tools, resize handles, search
  words, filtered empty state, hover row actions and bulk bar name; the empty state's words, icon, reason and heading
  level with its buttons drawn as action buttons; and a form field's words, required, disabled and read-only overrides,
  named control, number bounds, grid span, choices and `visibleWhen`. `@stackra/panel/react` adds the kit's
  `ActionButton`, `RowActions` and `BulkActions`. The showcase lists the three under Blocks.

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/navigation@0.9.0
  - @stackra/clients@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/access-log@0.9.0
  - @stackra/database@0.9.0
  - @stackra/tenancy@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/pricing@0.9.0
  - @stackra/documents@0.9.0
  - @stackra/filesystem@0.9.0
  - @stackra/icons@0.9.0
  - @stackra/experience@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/query@0.9.0
  - @stackra/money@0.9.0
  - @stackra/data-transfer@0.9.0
  - @stackra/entitlements@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/access-log@0.8.0
  - @stackra/entitlements@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/tenancy@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/clients@0.8.0
  - @stackra/money@0.8.0
  - @stackra/pricing@0.8.0
  - @stackra/data-transfer@0.8.0
  - @stackra/documents@0.8.0
  - @stackra/filesystem@0.8.0
  - @stackra/model@0.8.0
  - @stackra/icons@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/experience@0.8.0
  - @stackra/navigation@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/query@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- @stackra/access-log@0.7.1
  - @stackra/tenancy@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/clients@0.7.1
  - @stackra/navigation@0.7.1
  - @stackra/experience@0.7.1
  - @stackra/query@0.7.1
  - @stackra/pricing@0.7.1
  - @stackra/documents@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/money@0.7.1
  - @stackra/data-transfer@0.7.1
  - @stackra/database@0.7.1
  - @stackra/filesystem@0.7.1
  - @stackra/model@0.7.1
  - @stackra/icons@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/support@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/entitlements@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/tenancy@0.7.0
  - @stackra/clients@0.7.0
  - @stackra/navigation@0.7.0
  - @stackra/access-log@0.7.0
  - @stackra/query@0.7.0
  - @stackra/experience@0.7.0
  - @stackra/pricing@0.7.0
  - @stackra/documents@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/money@0.7.0
  - @stackra/data-transfer@0.7.0
  - @stackra/database@0.7.0
  - @stackra/filesystem@0.7.0
  - @stackra/model@0.7.0
  - @stackra/icons@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/support@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/entitlements@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/clients@0.6.1
  - @stackra/money@0.6.1
  - @stackra/pricing@0.6.1
  - @stackra/data-transfer@0.6.1
  - @stackra/database@0.6.1
  - @stackra/documents@0.6.1
  - @stackra/filesystem@0.6.1
  - @stackra/model@0.6.1
  - @stackra/icons@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/experience@0.6.1
  - @stackra/navigation@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/support@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/access-log@0.6.1
  - @stackra/entitlements@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/tenancy@0.6.1
  - @stackra/query@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [99750d4]
- Updated dependencies [e250d4f]
- Updated dependencies [c64a55d]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/database@0.6.0
  - @stackra/navigation@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/tenancy@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/access-log@0.6.0
  - @stackra/entitlements@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/clients@0.6.0
  - @stackra/money@0.6.0
  - @stackra/pricing@0.6.0
  - @stackra/data-transfer@0.6.0
  - @stackra/documents@0.6.0
  - @stackra/filesystem@0.6.0
  - @stackra/model@0.6.0
  - @stackra/icons@0.6.0
  - @stackra/experience@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/support@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/query@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/access-log@0.5.1
  - @stackra/entitlements@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/tenancy@0.5.1
  - @stackra/data-transfer@0.5.1
  - @stackra/clients@0.5.1
  - @stackra/navigation@0.5.1
  - @stackra/query@0.5.1
  - @stackra/documents@0.5.1
  - @stackra/experience@0.5.1
  - @stackra/pricing@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/money@0.5.1
  - @stackra/filesystem@0.5.1
  - @stackra/model@0.5.1
  - @stackra/icons@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/support@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [104d9f4]
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/tenancy@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/clients@0.5.0
  - @stackra/experience@0.5.0
  - @stackra/navigation@0.5.0
  - @stackra/access-log@0.5.0
  - @stackra/pricing@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/query@0.5.0
  - @stackra/documents@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/money@0.5.0
  - @stackra/data-transfer@0.5.0
  - @stackra/database@0.5.0
  - @stackra/filesystem@0.5.0
  - @stackra/model@0.5.0
  - @stackra/icons@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/support@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/entitlements@0.5.0

## 0.4.0

### Minor Changes

- b5ae8a4: An action of another model than the resource's is labelled `<module>::resources.<model>.actions.<action_model>_<verb>`,
  so two actions with one verb of different models on one page no longer share a label; the resource's own actions keep
  `actions.<verb>`.
- d0fa2f8: Resource forms and the action input modal draw date inputs: a calendar day (`z.iso.date()`) as a date picker held as
  `YYYY-MM-DD` with no time zone, and an instant (`Date`, `isoDateTime()`, `z.iso.datetime()`) as a day, an hour and a
  minute in the viewer's own time zone (named under the field) held as a UTC ISO 8601 string.
- 2bcee04: A List header or empty-state action whose input has fields now opens the action input modal and runs once without a
  record, instead of running with an empty input.
- 1a3bc4d: A Json input (`json()`, `unknown`) is edited in resource forms and the action input modal as JSON text: valid text
  submits the parsed value, and text that does not parse shows an error and blocks the submit instead of going out as a
  string.
- 298d942: `e.list(key, columns, { labels: { status: I18n.<module>.enums.<enum> } })` names a list column's enum labels, as
  `.labels()` does on a column or an entry, so a list cell shows the label instead of the raw code.
- 08bd3f9: Resource forms and the action input modal draw object inputs as a titled group of their keys and list inputs as rows to
  add and remove (a group per row for a list of objects, one field per row for a list of values), so checkout, returns,
  labels, counts and other actions with nested input can be entered.
- 8f2c40a: The action input modal starts each form key from the record's own value at that key (a drafted reply), so staff confirm
  or edit it instead of retyping it.
- 3953e1a: A form's `currency` field is a pick of ISO 4217 codes, and a minor-unit amount beside one (a MoneyAmount's `minor`, a
  nested or list row's `…Minor`) is entered in major units of that chosen currency; until a valid currency is chosen it
  stays in minor units.
- 9f48901: A `…Minor` number field in a resource form or the action input modal is entered in major units of the record's currency
  (formatted as that currency) and still submitted in minor units; without a known currency it stays in minor units.
- c19730d: A money object (`@stackra/money`'s `MoneyAmount`, `{ minor, currency }`) in a list cell, a table column or an entry
  shows as money in its own currency instead of as JSON; flat `…Minor` fields with a `currency` keep working.
- b8d8554: An action whose input has any field besides the record id now opens the action input modal, optional and defaulted
  fields included, so it shows its form and confirmation instead of running at once (ADR 0307 rule 3, amended).
- 5d60d4a: A Record input (`z.record(z.string(), v)`, such as an EDI field map) is edited in resource forms and the action input
  modal as key and value rows to add and remove (a number value as a number field), instead of falling back to text.
- a1229d0: A relation manager takes record actions for its rows (`r.table(Query, columns, { actions: [...] })`): each runs with the
  row's id under the related model's id key and the relation's bound inputs filled in (opening the action input modal when
  it takes more), so a child-keyed action such as releasing an order's hold sits on the parent's View page.
- 39f8662: A form select shows each enum code by its label (the resource model's enum, else in the action input modal the action
  model's, e.g. `commerce::enums.company_member_role.owner`) instead of the raw code.

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- 36dbd49: Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
  `registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
  models whose stand-in `./node` barrel misses it.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [bc2c53e]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [8d29426]
- Updated dependencies [2bbc0e8]
- Updated dependencies [58c7da9]
- Updated dependencies [1856ee0]
- Updated dependencies [dedaa81]
- Updated dependencies [a7eaed4]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/access-log@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/tenancy@0.4.0
  - @stackra/container@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/data-transfer@0.4.0
  - @stackra/documents@0.4.0
  - @stackra/model@0.4.0
  - @stackra/support@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/clients@0.4.0
  - @stackra/entitlements@0.4.0
  - @stackra/query@0.4.0
  - @stackra/pricing@0.4.0
  - @stackra/filesystem@0.4.0
  - @stackra/icons@0.4.0
  - @stackra/experience@0.4.0
  - @stackra/navigation@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/money@0.4.0

## 0.3.0

### Minor Changes

- 23e556c: The queued export never writes a `credential` column, even when it is opted in under the L2 permission (STA-1677, ADR 0494).
- 9ed272a: The List page and relation tables run on `@stackra/ui`'s `useCollection` engine (ADR 0505): the search, filter, sort,
  cursor pages and selection live in the engine, the declared filters come from the columns (an enum as a choice of
  several codes, sent as a list), and the saved and preset views are one list's engine views drawn as tabs, so a view's
  group and totals are kept instead of dropped. `SavedViewTabs` now takes `{ collection, label }` and draws
  `SavedViews variant="tabs"`; `ResourceTable` takes `views` and `presets` instead of one `view` or `preset`.
  
  The advanced filter editor's conditions reach the server too, each in its `TableFilter` wire form (equals and any of
  as a list, comparisons, contains, between as a range, before and after, empty and not empty), one per key from a
  filter that matches all; an any-match filter, a nested group, "does not contain" and "is none of" are not sent.
  Those it cannot send are marked: `listFiltersOf` returns `{ values, unsent }`, and the list's filter bar draws the
  unsent conditions as warning chips (`unappliedIds`).
- ccc0b0f: Add `pageContextOf(listState, record, selection)` (STA-1631, ADR 0490): the AI page context a panel page publishes with
  no declaration, as the structural `PanelPageContext` (the record id, at most 200 selected ids with the full count, and
  the list's applied filters). Pure; it imports no AI package.
- 7053c20: Preset views draw as tabs on the List page and can read their list query with a fixed input: `v.view("merged", {}).input({ includeMerged: true })`, typed by the query's input (`Views<R, QueryInput<typeof ListQuery>>`) and sent under the viewer's filters, sort, search and cursor.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [30c3874]
- Updated dependencies [18ea367]
- Updated dependencies [be75ede]
- Updated dependencies [4a6abd7]
- Updated dependencies [895a526]
- Updated dependencies [ccc0b0f]
- Updated dependencies [d5b5411]
- Updated dependencies [a60f4e9]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/access-log@0.3.0
  - @stackra/clients@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/data-transfer@0.3.0
  - @stackra/documents@0.3.0
  - @stackra/entitlements@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/experience@0.3.0
  - @stackra/filesystem@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/icons@0.3.0
  - @stackra/model@0.3.0
  - @stackra/money@0.3.0
  - @stackra/navigation@0.3.0
  - @stackra/pricing@0.3.0
  - @stackra/query@0.3.0
  - @stackra/support@0.3.0
  - @stackra/tenancy@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- 6f3536e: A record or bulk action whose input needs more than the record id now opens a modal form generated from its input
  schema (ADR 0307 rule 3): the record id pre-filled, the declared confirm copy shown, one run per selected record, and
  the server's field errors kept on the form with only the refused records left to retry.
- 9558710: Resource tables and View pages show an enum code by its localised label (`<module>::enums.<model>_<field>.<code>`,
  then `<module>::enums.<field>.<code>`, or the keys a column or entry names with the new `.labels(...)`), and a flag
  as a localised yes or no instead of a bare tick or cross.
- eb69aa6: A View page's list entry formats its cells like any value: a `…Minor` cell is money in the item's own `currency`, else
  in the record's currency named by the new `e.list(key, columns, { currency })` option, instead of raw minor units.
- eb37de7: The generic Create and Edit pages each keep only the recorded form fields their own action's input takes, so one
  declared form serves both modes when the create and update inputs differ (an `active` switch only Edit takes).

### Patch Changes

- Updated dependencies [f7ae148]
- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/access-log@0.2.0
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/entitlements@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/query@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/experience@0.2.0
  - @stackra/navigation@0.2.0
  - @stackra/money@0.2.0
  - @stackra/pricing@0.2.0
  - @stackra/model@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 3da2dcc: Unique form names (STA-1383). The two form models are different things (a tenant-built form a respondent fills, and
  an admin resource form), so they keep separate shapes with separate names. Breaking renames:
  
  - `@stackra/builder`: the form document types `FormField` and `FormStep` are `FormDocumentField` and
    `FormDocumentStep` (its `visibleFields`, the respondent's conditional fields, keeps its name).
  - `@stackra/panel`: `visibleFields(fields, mode)` is `fieldsForMode(fields, mode)` (`FormField` and `FormStep`, the
    resource form builders, keep their names).
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
- a7961d4: Add the generic resource pages to `@stackra/panel/react` (stackra-220): `ResourceListPage` (the recorded columns, sort,
  filters and search through `@stackra/ui`'s `FilterBar`, cursor pagination, row actions and the bulk bar fanned out per
  record), `ResourceViewPage` (the infolist's entries and sections, the header actions run through the action runner,
  and the relation managers), `ResourceFormPage` (Create and Edit from the recorded form fields or the action input's
  own keys, validated by the input schema, with the server's field errors on their fields) and `RelationManager`.
  `registerPanelPages()` now also registers them as navigation's `resource` page, so every `toResource` route has a page
  with no extra code. `registerResources(trees)` (in `.`) hands the generated resource trees to the pages; a resource
  with no registered tree shows the row's, record's and input's own keys. New `panel::resources.*` texts in all seven
  locales.
- 2787c1e: Add `@stackra/panel`: the `Resource`, `Widget`, `Document` and `Panel` kinds with pure builders gen records, the metric
  shapes and time range input with their schemas, typed slots and placement layers, the data constructors of the
  generated resources, panels and slots, and the web dashboard, shell, action runner and native widget slot. The shell
  holds navigation's breadcrumb trail (`useBreadcrumbs` is re-exported), and `registerPanelPages` gives navigation the
  page its panel routes render.
- aaab926: The plan-catalogue admin console (`PlanCatalogueAdmin`, `CatalogueVersions`, `CatalogueRowsEditor`,
  `CatalogueProposalForm`; STA-799) with dated versions, renewal timing and the second approver for discounts, and the
  `OnboardingChecklist` component (STA-776), with their words in seven languages.
- 9ab18b4: Queued resource export (STA-1490, reporting gap 11, ADR 0307 rule 10). `@stackra/panel/node` adds `ExportRunner`: it
  pages a resource's list query as the reader (per-row permissions), drops `@Classified` columns unless opted in under an
  L2 permission, streams at most `maxRows` rows into CSV, XLSX, JSON Lines or PDF on the host disk, and returns a 24-hour
  signed link whose issue is access-logged. Adds `ExportInput`, `ExportOutput`, `ExportSource`, `ExportConfig`
  (`ExportOptions`, `ExportConfig$`), and `ExportFormat.JsonLines` and `ExportFormat.Pdf`. `@stackra/documents` adds
  `PdfTableWriter`, data-transfer's `TabularWriter` for PDF, built per export. New dependencies: panel on
  `@stackra/access-log`, `@stackra/config`, `@stackra/data-transfer`, `@stackra/documents`, `@stackra/filesystem`;
  documents on `@stackra/data-transfer`.
- bf83013: Saved view shapes (STA-1489). `SavedView.sort`, `group` and `totals` (and `StoredView`'s) are now the shape classes
  `SavedViewSort`, `SavedViewGroup` and `SavedViewTotal`, exported with their shipped schemas `SavedViewSort$`,
  `SavedViewGroup$` and `SavedViewTotal$`, so gen compiles them as shapes instead of zod hatches. `SavedView.filter` is
  typed `Record<string, Json>`. The wire format is unchanged: `SavedView$` composes the three schemas.
- c758552: Saved views, finished (STA-1489, reporting gap 7). `ViewStore` is now a port, and a new `./node` entry ships its
  `database` driver `DatabaseViewStoreDriver` over `panel.stored_views` (tenant policy, `version` column, migration 0001),
  with `StoredView`, `StoredViewService` and `ViewPermissions.share` (`panel.view.share`). `SavedView` gains `layout`
  (`ViewLayout`: table, board, gallery, calendar, chart) with `layoutBy`, `version`, and role copies
  (`ViewSharing.Role` with `role`). The server validator `unknownViewKeys` refuses undeclared keys with
  `ViewKeyUnknownError` (`view_key_unknown`). `ResourceListPage` takes a `views` store and draws saved views as tabs; the
  native entry adds `SavedViewTabs`. New dependencies: `@stackra/database`, `@stackra/model`, `@stackra/tenancy`.
- 0ad504e: Add saved views with grouping, sub-grouping, totals and sharing (`SavedView`, `SavedView$`, the `ViewStore` port,
  `groupRows`, `Aggregate`, `ViewSharing`); normal and developer visibility of form fields (`essential` on `FormField`
  and `.essential()` in a form, `visibleFields`); and edition slots of ADR 0350: `Place.LineEntry` with `lineEditorOf`,
  and `activeContributions` for contributions to enhanced modules.
- 2e21e6a: Add the French, German, Spanish, Italian and Dutch `panel` catalogues (STA-788, ADR 0403).
- d7c5bf2: Add shell slot contracts (ADR 0438): `defineSlot<Props>({ key, surface, cardinality })` declares a typed slot in a
  shell package and `fillSlot(slot, component, { surface })` fills it from a product's UI package, with the `Slot`,
  `SlotFill`, `SlotOptions`, `SlotCardinality` and `SlotComponent` types.
- ae9621e: Reports return server subtotals per leading dimension (`subtotals: true`) and a pivot matrix with row and column
  totals (`pivot: { rows, columns }`), all from one grouping-sets statement. The panel's `Aggregate` is now
  `@stackra/database`'s (`average` becomes `avg`, `distinct` is added); `groupRows` is for fully loaded tables only.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 9811f8d: Add the search API and the Cmd+K palette (ADR 0221 d4 and d6, STA-1459): `SearchQuery(Model)` in
  `@stackra/search/node` is the base of the `<model>.search` query gen writes per `@Searchable` model, answering a phrase
  with hits of key, title and snippet under the caller's visibility (`SearchQueryInput`, `SearchQueryOutput`,
  `SearchQueryHit`); a public search is the same query with anonymous actors in the public area. `SearchPalette` in
  `@stackra/panel/react` searches those queries as the reader types and hands the picked hit to the app.
- 3e2fc84: `CrudService.table(input, { count })` adds the matching rows' count to the page (`page.count`, a `TableCount`).
  `Count.Estimated` counts exactly up to 10,000 rows (`BULK_LIMITS.countCap`) and past it reports the cap with the
  planner's estimate; `Count.Exact` counts every row (ADR 0307 rule 12, reporting gap 6). `Count` now lives in
  `@stackra/database`; `@stackra/panel` re-exports it, and the resource list shows the count beside the filter bar,
  capped as "10,000+" (new `panel::resources.count` and `count_capped` texts in all seven locales).
- 5e8114b: Resource tables get the full filter and sort vocabulary (reporting gap 5, ADR 0307 rule 2). `@stackra/database`:
  `CrudService.table` reads each filter value as a `TableFilter` (a value, a list, or `{ op }` for `range`,
  `dateRange` with bounds or a named relative range resolved by the new `TableOptions.period`, `gt`/`gte`/`lt`/`lte`/`ne`,
  `contains` and `isNull`) and a multi-key sort (`TableSort[]`, three keys at most, the primary key last). Any other
  object filter value, which used to reach MikroORM as is, is now refused with `table_filter_invalid`
  (`TableFilterInvalidError`). `@stackra/panel`: `Filter.range`, `Filter.dateRange`, `Filter.compare` with the new
  `FilterComparison` enum, `Filter.contains`, `Filter.isNull` (and the same on the table builder's filter factory),
  `.thenSort(key, direction)` tiebreak keys on the default sort, and `tableInput` sends each drawn value in its wire form;
  the web list draws range, date-range and is-null filters with `@stackra/ui`'s number, date-range and boolean editors.
  `@stackra/gen`: the full pass refuses a recorded resource table that sorts or filters on a path no index leads with
  (`sort_not_indexed`, `filter_not_indexed`).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 187afe3: `CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
  no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
- 4c5af60: The panel catalogues ship the derived labels of every enum case in all seven locales: `ExportFormat` `jsonl` and `pdf`,
  `FilterComparison` (`gt`, `gte`, `lt`, `lte`, `ne`), `ViewLayout` and `ViewSharing` `role`, so gen no longer refuses
  them as `i18n_key_missing`.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e01195a]
- Updated dependencies [7149b08]
- Updated dependencies [2787c1e]
- Updated dependencies [f96db97]
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [5ae13cb]
- Updated dependencies [bc4acfc]
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dddbbcd]
- Updated dependencies [e2a4b0d]
- Updated dependencies [b3c4658]
- Updated dependencies [975b28c]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [dfa0c6a]
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [fd3427e]
- Updated dependencies [e01195a]
- Updated dependencies [783fb5b]
- Updated dependencies [c994359]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [5a25b49]
- Updated dependencies [d58a505]
- Updated dependencies [f65a9e9]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [e8ab3ca]
- Updated dependencies [2787c1e]
- Updated dependencies [903c2a5]
- Updated dependencies [a57a0df]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [27efea7]
- Updated dependencies [0a38324]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [2787c1e]
- Updated dependencies [914465a]
- Updated dependencies [9310c51]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0a20a9f]
- Updated dependencies [9ab18b4]
- Updated dependencies [90957bd]
- Updated dependencies [f833d94]
- Updated dependencies [85b7b49]
- Updated dependencies [2787c1e]
- Updated dependencies [c63175b]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [e7a388a]
- Updated dependencies [2d7233c]
- Updated dependencies [2787c1e]
- Updated dependencies [6912039]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [1271b88]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/access-log@0.1.0
  - @stackra/actions@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/entitlements@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/experience@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/money@0.1.0
  - @stackra/navigation@0.1.0
  - @stackra/pricing@0.1.0
  - @stackra/query@0.1.0
  - @stackra/support@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

# AGENTS — @stackra/licensing

The licence verifier (ADR 0178). Member at `packages/security/licensing` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing… | It goes in…                                 |
| ---------------- | ------------------------------------------- |
| A function       | `src/core/functions/<name>.function.ts`     |
| A type           | `src/core/types/<name>.type.ts`             |
| An enum          | `src/core/enums/<name>.enum.ts`             |
| A refusal        | `src/core/errors/<name>.error.ts`           |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- `decodeBase64`, `decryptLicence`, `isRecord` and `readLicence` stay internal.

## This package

- No phone-home (ADR 0178 decision 5): `checkLicenceKey` is the only network call and runs only when the caller asks.
- Expiry is a standing, never a refusal (decision 4). Nothing here deletes or hides data.
- Web Crypto only (`crypto.subtle`, Ed25519 and AES-GCM); no crypto dependency.
- No parameter properties, no `#private` fields, no decorators (`erasableSyntaxOnly`).

## PII and secrets

| Data             | Where                                  | Handling                                                                                 |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Licence key      | `verifyLicenceFile`, `checkLicenceKey` | Used to decrypt or sent in the body to Keygen; never stored, logged or put in a refusal. |
| Verify key       | `verifyLicenceFile`                    | Public; never a secret.                                                                  |
| Licence metadata | `Licence.metadata`                     | Returned as the signed file states it; never logged here.                                |

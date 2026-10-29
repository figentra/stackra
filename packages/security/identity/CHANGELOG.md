# @stackra/identity

## 0.1.0

### Minor Changes

- 8377336: Add the `IdpAdmin` port (users, machine users, ending sessions, the OAuth device flow, login policy) with
  `ZitadelIdpAdminDriver`, configured by `IdpAdminConfig` (the managed or own ZITADEL URL and the
  `IDENTITY_IDP_ADMIN_TOKEN` secret), and `MemoryIdpAdminDriver` (STA-834). Add API-key verification by hash: the
  `ApiKeyStore` port, `hashApiKey`, `ApiKeyVerifierService` and `MemoryApiKeyStoreDriver` (STA-835, ADR 0410).
- 1c230bd: `LoginPolicy` gains optional `externalProviderIds` and `secondFactors` (new `IdpSecondFactor` enum); the ZITADEL
  `IdpAdmin` driver brings an organisation's login-policy providers and second factors to exactly the listed ones, and the
  memory driver keeps a list a later policy leaves out. The infra-identity README names the `identity` machine's roles and
  its token as `IDENTITY_IDP_ADMIN_TOKEN`. STA-1263.
- 2787c1e: Add `@stackra/identity`: `IdentityConfig` with its shipped schema, `AuthFlow` and `SessionStatus`, the `SessionStore`
  port with the BFF cookie and PKCE drivers, `SessionService` with the session claims mapping (the scope claim is
  `@stackra/scope`'s `SCOPE_PATH_CLAIM`), which also keeps `@stackra/iam`'s permission snapshot, the `ClientSession` and
  memory `IdentityResolver` drivers, the `OfflineSession` driver through which a revoked session wipes and locks the
  offline stores of `@stackra/query`, `useSession` in `./react`, and `fakeSession` and `fakeIdentity` in `./testing`.
- 0006947: Add the server half of passkeys and end an erased subject's sessions (STA-1538, STA-1543). `IdpAdmin` gains
  `findUserId` (the provider user of a `usr_` id, kept as the `stackra_user_id` metadata `createUser` now writes from
  `IdpUserInput.stackraUserId`), `startPasskeySignIn` and `finishPasskeySignIn` (a ZITADEL v2 session with a `webAuthN`
  challenge and its check) and `startPasskeyRegistration` and `finishPasskeyRegistration` (the v2 user passkey
  endpoints); the ZITADEL and memory drivers implement them. A custom `IdpAdmin` driver must implement the five new
  methods. The new `./node` entry ships `ChallengePasskeyAction`, `VerifyPasskeyAction`, `RegisterPasskeyAction` and
  `ConfirmPasskeyAction` with `PasskeyPermissions` and their schemas, and `EndErasedSubjectSessionsListener`, which ends
  every provider session of the subject of @stackra/privacy's `SubjectErased` and then removes its provider user (it takes
  a `Logger` and warns when the provider has no user for the subject). `signInWithPasskey` and `registerPasskey`
  in `.` wire a `Passkeys` driver (`ExpoPasskeysDriver` on a phone) to those actions.
- 0f96a66: Add the `Passkeys` port (`./contracts`) for the device step of a passkey registration or sign-in against the identity
  provider, with `PasskeyRefusal` and the WebAuthn option and credential types; `MemoryPasskeysDriver` (`.`) for tests
  and web, and `ExpoPasskeysDriver` (`./native`) over `react-native-passkey` (iOS 15+, Android 9+), mapping its errors
  to refusals (STA-1538). New optional peer: `react-native-passkey`.
- e3be0c3: Add API-key last use (`ApiKeyRecord.lastUsedAt`, `ApiKeyStore.recordUse` with a no-op default, written by
  `ApiKeyVerifierService` when older than the new `IdentityConfig.apiKeyLastUsedSeconds`), `IdpAdmin.listAuthMethods`
  (enrolled methods as RFC 8176 `amr` codes, on the ZITADEL and memory drivers) for the security page's MFA enrolment
  list, and the `AutomationPrincipals` port with `MemoryAutomationPrincipalsDriver` so an automation runs as its own
  principal (ADR 0153 decision 2). STA-1264.
- 391f64d: Add step-up (`AssuranceLevel`, `assuranceOf`, `requireAssurance`, `stepUpSignIn`, `StepUpRequiredError`) and sign-in
  options on `SessionStore.signIn` and `SessionService.signIn`; external identity providers per market from the market
  pack (`signInProvidersOf`, `externalSignIn`); the `./native` (`ExpoSignInBrowserDriver`) and `./desktop`
  (`ElectronSignInBrowserDriver`) entries; staff PIN quick-switch and manager override (`StaffPinService`, the
  `StaffPinStore` port with storage and memory drivers); publishable, origin-bound API keys (`ApiKeyKind`, `mintApiKey`,
  `parseApiKey`, `checkPublishableKey`, `isOriginAllowed`); a guardian acting for a minor (`GuardianActingService`, the
  `Guardianship` port); and the KYC and KYB `Verification` port with `VerificationService`, which picks providers from
  market-pack data. `IdentityConfig` gains the settings these read.
- 2bf1a5d: `./testing` gains `runVerificationCase(driver, case)` with `VerificationCase` and `VerificationCaseResult`: the
  recorded-fixture harness for `Verification` drivers. It checks a driver's answer against the recorded status, reasons
  and provider reference and against the port's rules (supported kind, `verification_unavailable` on an outage, snake_case
  reasons, none when verified, a valid `checkedAt`, no subject fact echoed back). The KYC and KYB vendor drivers are OS
  integrations code (ADR 0443 decision 7) and run their recorded cases through it, marked certification pending until a
  sandbox run passes (owner decision D3, stackra-58, STA-1052).
- eb2628a: Add the login directory writer (ADR 0451, STA-752): `loginDirectoryPrefix`, `LoginDirectoryStore`, `LoginIdentifierKind`,
  `LoginIdentifier` and `LoginDirectoryKey` in `./contracts`; `LoginDirectoryWriterService`, `LoginDirectoryConfig` (with
  `LoginDirectoryConfig$` and `LoginDirectoryOptions`, key `login_directory`, secret `IDENTITY_LOGIN_DIRECTORY_KEY`) and
  `MemoryLoginDirectoryStoreDriver` in `.`.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- c7e6988: Add verification to the `ProviderResolver` capabilities (ADR 0376 decision 1 Note, STA-1282): `candidates` takes
  `pin` to keep one mode only, `VerificationUse` (`platform` or `tenant`) on `VerificationRequest`, the
  `VerificationCandidate` type and `VerificationService#verifyThrough`, which runs a platform check only through
  platform Connections and a tenant check through the tenant's own Connection first. `VerificationResult` gains `mode`.
- d19a3d5: The BFF session store sends the CSRF header on every credentialed call (STA-1385). New `IdentityConfig.csrfHeader`
  (default `x-stackra-csrf`, lower case), which must equal the API's `app.csrf.headerName`, so @stackra/app's
  `CsrfGuard` lets a cookie-bearing sign-out through.

### Patch Changes

- 51d83d1: `MemoryIdpAdminDriver.finishPasskeySignIn` now takes the device's credential as its second argument, as the
  `IdpAdmin` port declares, so a caller holding the memory driver passes the same arguments as against ZITADEL.
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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
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
- Updated dependencies [0abe92d]
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
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [0a38324]
- Updated dependencies [6f2c1f7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [0cfb47a]
- Updated dependencies [ca89a64]
- Updated dependencies [a7b4dd1]
- Updated dependencies [738ba15]
- Updated dependencies [dc490c0]
- Updated dependencies [0e7eb1f]
- Updated dependencies [e7a388a]
- Updated dependencies [2d7233c]
- Updated dependencies [2787c1e]
- Updated dependencies [6912039]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [376a093]
- Updated dependencies [93fa8f1]
- Updated dependencies [89548ea]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c3ff8a7]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/privacy@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/query@0.1.0
  - @stackra/scope@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/support@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/transport@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.

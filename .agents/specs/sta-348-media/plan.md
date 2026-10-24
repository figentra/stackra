# Plan: `@stackra/media` wave 7

**Spec**: `.agents/specs/sta-348-media/spec.md`

## Design

- `Bucket(options)` is `createKind("bucket", BucketBase, read)`, called only; `read` checks visibility, `maxBytes`,
  a non-empty `accept` of `MediaType` codes and each variant (`checkImageVariant`), then freezes. `bucketOptionsOf`
  reads the record back; `bucketKeyOf` takes the key `registerBuckets` stored, else the class name in snake_case.
- `Upload<B>` is a type plus a frozen `{ schema }` of the same name (the `Enum.of` pattern): `{ id: PublicId<"upl"> }`,
  with `B` as a type-only phantom.
- `MediaDisk` (contracts) adds what `FileSystem` lacks: `signUpload` (a `PUT` URL with signed headers), `stat` with
  metadata, and `move`. The memory driver keeps grants by a random signature and offers `receive`, the store's side of
  a `PUT`, checking signature, expiry and every signed header. The S3 driver presigns with `signableHeaders`
  `content-type` and the metadata headers unhoisted, turns off request checksums so a presigned `PUT` carries none, and
  moves by copy and delete.
- `MediaLibrary extends Service` takes `MediaDisk`, `MediaConfig` and `Clock`. `createUpload` checks the bucket's rules
  and signs `uploads/<id>` with metadata `{ bucket, expires }`. `claim` validates the id, stats the object, then
  refuses in order: incomplete, bucket mismatch, expired, rejected (deleting the file); it moves the file to
  `filePathOf(...)`.
- `Uploader` lives in `core/ports` because it speaks `Upload` (the `SecretStore` precedent). The HTTP driver posts to
  `uploadEndpoint`, parses the answer with zod, puts the bytes and maps every failure to `UploadFailedError`.
- `CreateUploadAction` (`upload.create`, users and agents) resolves the bucket with `bucketByKey` (`null` is the only
  registered bucket) and returns `CreateUploadOutput.create(...)`. Input and output ship their `X$` and register them.
- `useUpload` is `useCallback` over `useContainer().get(Uploader)`; `useImageVariant` is `useMemo` over
  `imageVariantUrl`, which appends `w`, `h` and `format`.
- `fakeUpload` runs `createUpload` and the memory disk's `receive`, and predicts the claimed URL with `filePathOf`;
  `null` signs for `ForeignBucket`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                           |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/media`; workspace imports: actions, config, container, contracts, errors, filesystem, validation (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | no secret is read, stored or logged; the S3 driver uses the AWS SDK credential chain; tests use test-only fake credentials through the environment                             |
| Security                              | PASS   | the claim trusts only the upload id; paths are server-built; signed headers bind type, bucket and expiry; SVG is not accepted; the CDN serves `public/` only                   |
| HTTP and events                       | PASS   | one action, `upload.create` (`POST /uploads`), derived permission `media.upload.create`, refusals by `Refusal({ kind })`; no event                                             |
| Tenancy                               | N/A    | no tenant-owned table; no tenant vocabulary (R-59)                                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                         |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | S3, R2 or MinIO in every mode; no SaaS-only code path                                                                                                                          |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                        |

- Boundaries: `./contracts` imports only `@stackra/contracts`; `./react` and `./testing` import `.`; `./node` imports
  `.` internals through `#core/*`.
- Versions: catalogs and `workspace:*` only; no new catalog entry.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name><Port>Driver`; errors end in `Error`; `Enum.of`, no `enum`.
- Secrets: none.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| SaaS       | S3 or R2 behind the CDN; uploads go from the browser straight to the store                     |
| On-prem    | identical: MinIO through `filesystem.s3.endpoint` and `forcePathStyle`; no SaaS-only code path |
| Air-gapped | identical: MinIO inside the network; nothing calls out                                         |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./node`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `Bucket`, `BucketVisibility`, `ImageFormat`, `MediaLibrary`, `MediaType`, `Upload` (with `Upload.schema`) and `UploadBucketMismatchError`, and `Bucket({...})` records the template bucket's options as kind `bucket` — Validates: FR-002
- **P-003**: `MediaDisk` is keyed `media.MediaDisk` and `DriverName<MediaDisk>` is `"memory" | "s3"` — Validates: FR-003
- **P-004**: `useUpload()` returns a function resolving to an `Upload`, and `useImageVariant` returns the variant URL with its box, or `undefined` for no image — Validates: FR-004
- **P-005**: the URL `fakeUpload` returns equals the URL `MediaLibrary.claim` returns for that token, and a `null` bucket's token is refused with `UploadBucketMismatchError` — Validates: FR-005
- **P-006**: `MediaLibrary.claim` reads the bucket, type, size and expiry from the stored object and never from the request, refuses before moving, and a second claim of one token is refused — Validates: FR-006

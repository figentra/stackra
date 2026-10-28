/**
 * Stackra file contract:
 * Purpose: `PrivacyModule`, the root module of @stackra/privacy: a host imports it once, and the DSAR export, the
 *          erasure saga and the export purge become available, over the declarations each module registered.
 * Boundary: exports `SubjectExportService`; the actions, the workflow and the drivers are found by their groups. The
 *           host wires a `FileSystem` disk and a `SubjectSaltStore` driver (`PostgresSubjectSaltStoreDriver` or its key
 *           service), and passes `SaltedSubjectCipherResolverDriver` to `EncryptedFieldsSubscriber` (stackra-263).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0295 (decision 1); STA-1375.
 */
import { Module } from "@stackra/container";

import { SubjectExportService } from "#core/services/subject-export.service";

/** Imported once by a host. */
export class PrivacyModule extends Module({ exports: [SubjectExportService] }) {}
